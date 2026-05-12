import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto, RegisterDto } from './auth.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../../common/crypto/crypto.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { parseDurationToMs } from '../../common/parse/parse-durarion-to-ms';
import {
  JwtPayload,
  AuthSession,
  AuthTokenResult,
  AuthResult,
  VerifyAccountDto,
} from './types/auth.types';
import { Prisma } from '../../../generated/prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { OtpService } from '../../common/otp/otp.service';

interface CreateOtpRecordDto {
  email: string;
  hashedOtp: string;
  expiresAt: Date;
}
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,

    @InjectQueue('email-queue') private emailQueue: Queue,
  ) {}

  private generateToken(
    payload: JwtPayload,
    secretKey: string,
    expireKey: string,
  ) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get(secretKey),
      expiresIn: this.configService.get(expireKey),
      issuer: this.configService.get('APP_NAME'),
      audience: 'users',
    });
  }

  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  createAuthTokens(userId: string): AuthTokenResult {
    const refreshTokenTtl = this.configService.get<string>('REFRESH_EXPIRY');

    if (!refreshTokenTtl) throw new Error('REFRESH_EXPIRY is not configured');

    const accessToken = this.generateToken(
      { userId },
      'ACCESS_TOKEN_SECRET',
      'ACCESS_EXPIRY',
    );

    const refreshToken = this.generateToken(
      { userId },
      'REFRESH_TOKEN_SECRET',
      'REFRESH_EXPIRY',
    );
    const refreshTokenTtlMs = parseDurationToMs(refreshTokenTtl);

    const expiresAt = new Date(Date.now() + refreshTokenTtlMs);
    return {
      accessToken,
      refreshToken,
      refreshTokenTtlMs,
      expiresAt,
    };
  }

  async createSession(session: AuthSession, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    await client.session.create({
      data: {
        userId: session.userId,
        token: session.token,
        device: session.device,
        ipAddress: session.ipAddress,
        expiresAt: session.expiresAt,
      },
    });
  }

  private async createTokensAndSession(
    userId: string,
    device: string,
    ipAddress: string,
    tx?: Prisma.TransactionClient,
  ) {
    const { accessToken, refreshToken, refreshTokenTtlMs, expiresAt } =
      this.createAuthTokens(userId);

    // store a hash of the refresh token, never the raw value
    // So, a DB breach doesn't expose tokens
    const hashedRefreshToken = this.cryptoService.hashValue(refreshToken);

    await this.createSession(
      {
        userId,
        token: hashedRefreshToken,
        device,
        ipAddress,
        expiresAt,
      },
      tx,
    );

    return { accessToken, refreshToken, refreshTokenTtlMs };
  }

  private async createOtpRecord(
    data: CreateOtpRecordDto,
    tx: Prisma.TransactionClient,
  ) {
    return await tx.emailVerification.create({
      data: {
        email: data.email,
        hashedOtp: data.hashedOtp,
        expiresAt: data.expiresAt,
      },
    });
  }

  private async sendEmailJob(email: string, otp: number) {
    const userEmail = this.normalizeEmail(email);

    // Offload email sending to a queue so registration doesn't block on SMTP.
    await this.emailQueue.add(
      'send-verification',
      {
        email: userEmail,
        otp,
      },
      {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: true,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );
  }

  async registerUser(
    dto: RegisterDto,
    device: string,
    ipAddress: string,
  ): Promise<AuthResult> {
    const email = this.normalizeEmail(dto.email);
    const name = dto.name.trim();

    const hashedPassword = await this.cryptoService.hash(dto.password);
    const { otp, hashedOtp, expiresAt } = await this.otpService.generateOtp();

    try {
      // Wrap user creation, create otp record, and session in a single transaction
      // so a failure in any step rolls everything back, nothing will be created
      const result = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            name,
            password: hashedPassword,
          },
          select: { id: true, email: true },
        });

        await this.createOtpRecord(
          {
            email,
            hashedOtp,
            expiresAt,
          },
          tx,
        );

        //generate token ansd store the user session
        const token = await this.createTokensAndSession(
          newUser.id,
          device,
          ipAddress,
          tx,
        );

        return { newUser, token };
      });

      // Email is placed outside the transaction
      // a queue failure shouldn't roll back an already created account
      await this.sendEmailJob(email, otp);

      return result.token;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to create account');
    }
  }

  async loginUser(
    dto: LoginDto,
    device: string,
    ipAddress: string,
  ): Promise<AuthResult> {
    const email = this.normalizeEmail(dto.email);
    const password = dto.password;

    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true, password: true },
      });

      if (!existingUser || !existingUser.password) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // compare the incoming password with the stored hash in the DB
      const isPasswordMatch = await this.cryptoService.compareHash(
        password,
        existingUser.password,
      );

      if (!isPasswordMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }

      return await this.createTokensAndSession(
        existingUser.id,
        device,
        ipAddress,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Login Failed');
    }
  }

  async verifyAccount(data: VerifyAccountDto) {
    if (data.otp == null) {
      throw new BadRequestException('Please provide an otp');
    }

    const email = this.normalizeEmail(data.email);
    const now = new Date();

    // Fetch the most recent valid OTP for this email.
    // isUsed: false + expiresAt > now will be used to get the result
    const lookup = await this.prisma.emailVerification.findFirst({
      where: {
        email,
        isUsed: false,
        expiresAt: { gt: now },
      },
      select: {
        hashedOtp: true,
        id: true,
      },
    });

    if (!lookup) {
      throw new UnauthorizedException(
        'OTP expired. Please request another code.',
      );
    }

    const isMatch = await this.cryptoService.compareHash(
      String(data.otp),
      lookup.hashedOtp,
    );

    if (!isMatch) {
      throw new UnauthorizedException('Invalid otp code');
    }
    try {
      // Use updateMany with the other records for filter to help against a
      // race condition where two concurrent requests verify the same OTP the same time
      // If another request already marked it used, count will be 0 and we reject
      await this.prisma.$transaction(async (tx) => {
        const verify = await tx.emailVerification.updateMany({
          where: {
            id: lookup.id,
            isUsed: false,
            expiresAt: { gt: now },
          },
          data: {
            isUsed: true,
            usedAt: now,
          },
        });

        if (verify.count === 0) {
          throw new UnauthorizedException('OTP already used or expired');
        }

        await tx.user.update({
          where: {
            email,
          },
          data: {
            isVerified: true,
          },
        });
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Verification failed, please try again',
      );
    }
  }

  async resendEmail(email: string) {
    if (!email) {
      throw new BadRequestException('Please provide an email address');
    }

    const userEmail = this.normalizeEmail(email);

    const exisitingEmail = await this.prisma.user.findUnique({
      where: {
        email: userEmail,
      },
    });

    if (!exisitingEmail) {
      throw new NotFoundException('user not found');
    }

    const { otp, hashedOtp, expiresAt } = await this.otpService.generateOtp();

    try {
      await this.prisma.$transaction(async (tx) => {
        // invalidate any previous unused otp codes before issuing new one
        await tx.emailVerification.updateMany({
          where: {
            email: userEmail,
            isUsed: false,
            expiresAt: { gt: new Date() },
          },
          data: {
            isUsed: true,
          },
        });

        await this.createOtpRecord(
          {
            email: userEmail,
            hashedOtp,
            expiresAt,
          },
          tx,
        );

        await tx.emailVerification.create({
          data: {
            email: userEmail,
            hashedOtp,
            expiresAt,
          },
        });
      });
      await this.sendEmailJob(userEmail, otp);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to resend otp');
    }
  }

  async rotateRefreshToken(
    incomingRefreshToken: string,
    device: string,
    ipAddress: string,
  ) {
    if (!incomingRefreshToken) {
      throw new BadRequestException('Provide refresh token');
    }

    const now = new Date();

    // Hash first so we can look it up in the db
    const hashedIncomingToken =
      this.cryptoService.hashValue(incomingRefreshToken);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const revokeResult = await tx.session.updateMany({
          where: {
            token: hashedIncomingToken,
            isRevoked: false,
            expiresAt: { gt: new Date() },
          },
          data: {
            isRevoked: true,
            revokedAt: new Date(),
          },
        });

        if (revokeResult.count !== 1) {
          // count === 0 could mean the token is expired, already revoked, or doesn't exist
          // If it's already revoked, treat it as a token reuse attack
          // revoke ALL sessions for that user to force a full re-login.
          const reusedSession = await tx.session.findUnique({
            where: { token: hashedIncomingToken },
            select: {
              userId: true,
              isRevoked: true,
            },
          });

          if (reusedSession?.isRevoked) {
            await tx.session.updateMany({
              where: {
                userId: reusedSession.userId,
                isRevoked: false,
              },
              data: {
                isRevoked: true,
                revokedAt: now,
              },
            });
          }

          throw new UnauthorizedException('Invalid refresh token');
        }

        const oldSession = await tx.session.findUnique({
          where: { token: hashedIncomingToken },
          select: {
            userId: true,
          },
        });

        if (!oldSession) {
          throw new UnauthorizedException('Invalid refresh token');
        }

        const { accessToken, refreshToken, expiresAt, refreshTokenTtlMs } =
          this.createAuthTokens(oldSession.userId);

        const hashedNewRefreshToken =
          this.cryptoService.hashValue(refreshToken);

        // create a new session
        await tx.session.create({
          data: {
            userId: oldSession.userId,
            token: hashedNewRefreshToken,
            device,
            ipAddress,
            expiresAt,
          },
        });

        return {
          accessToken,
          refreshToken,
          refreshTokenTtlMs,
        };
      });

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Unable to rotate refresh token');
    }
  }

  async signOut(incomingRefreshToken: string) {
    if (!incomingRefreshToken) {
      throw new BadRequestException('Provide refresh token');
    }

    const hashedIncomingToken =
      this.cryptoService.hashValue(incomingRefreshToken);

    const existingSession = await this.prisma.session.findUnique({
      where: { token: hashedIncomingToken },
      select: { userId: true, isRevoked: true, expiresAt: true },
    });

    if (!existingSession) {
      throw new NotFoundException('Session not found');
    }
    await this.prisma.session.update({
      where: { token: hashedIncomingToken },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
  }
}
