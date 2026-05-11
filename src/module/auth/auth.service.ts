import {
  BadRequestException,
  ConflictException,
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
} from './types/auth.types';
import { Prisma } from '../../../generated/prisma/client';
import { randomInt } from 'crypto';
import { EmailService } from '../../common/email/email.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,

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

  async registerUser(
    dto: RegisterDto,
    device: string,
    ipAddress: string,
  ): Promise<AuthResult> {
    const email = dto.email.toLowerCase().trim(); //the email should not contain space and to lowercase
    const name = dto.name.trim(); //the name should not contain space
    const otp = randomInt(100000, 1000000).toString(); //random 6 digits otp
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5mins expiry time

    // hash the password and otp before storing it in the DB
    const hashedPassword = await this.cryptoService.hash(dto.password);
    const hashedOtp = await this.cryptoService.hash(otp);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // create user
        const newUser = await tx.user.create({
          data: {
            email,
            name,
            password: hashedPassword,
          },
          select: { id: true, email: true },
        });
        //store the otp to the db
        await tx.emailVerification.create({
          data: {
            email: newUser.email,
            hashedOtp,
            expiresAt: new Date(expiresAt),
          },
        });
        //generate token ansd store the user session
        const token = await this.createTokensAndSession(
          newUser.id,
          device,
          ipAddress,
          tx,
        );

        return { newUser, token };
      });

      //creat a send verification job
      await this.emailQueue.add(
        'send-verification',
        {
          email,
          otp,
        },
        {
          attempts: 3,
          removeOnComplete: true,
          removeOnFail: false,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      return result.token;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Account already exists');
      }
      throw error;
    }
  }

  async loginUser(dto: LoginDto, device: string, ipAddress: string) {
    const email = dto.email.toLowerCase().trim();
    const password = dto.password;
    // find the user by email
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

    return this.createTokensAndSession(existingUser.id, device, ipAddress);
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

    // Hash the incoming refresh token so it can be compared with the stored hash in the DB
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
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
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
