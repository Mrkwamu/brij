import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto, RegisterDto } from './auth.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../../common/crypto/crypto.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { parseDurationToMs } from '../../common/parse/parse-durarion-to-ms';
import { JwtPayload, AuthSession, AuthTokenResult } from './types/auth.types';
import { Prisma } from '../../../generated/prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
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
  ) {
    const { accessToken, refreshToken, refreshTokenTtlMs, expiresAt } =
      this.createAuthTokens(userId);

    const hashedRefreshToken = this.cryptoService.hashToken(refreshToken);

    await this.createSession({
      userId,
      token: hashedRefreshToken,
      device,
      ipAddress,
      expiresAt,
    });

    return { accessToken, refreshToken, refreshTokenTtlMs };
  }

  async registerUser(dto: RegisterDto, device: string, ipAddress: string) {
    // check if an account with this email already exist
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // return message to tell user there's already an accoount
    if (existingUser) {
      throw new ConflictException('Account already exists with this email');
    }

    // hash the password before i stored it in the DB
    const hashedPassword = await this.cryptoService.hash(dto.password);

    //create the user and store data in the user table in the DB
    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name,
        password: hashedPassword,
      },
      select: { id: true },
    });

    return this.createTokensAndSession(newUser.id, device, ipAddress);
  }

  async loginUser(dto: LoginDto, device: string, ipAddress: string) {
    // find the user by email
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: { id: true, password: true },
    });

    if (!existingUser || !existingUser.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // compare the incoming password with the stored hash in the DB
    const isPasswordMatch = await this.cryptoService.compareHash(
      dto.password,
      existingUser.password,
    );

    if (!isPasswordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createTokensAndSession(existingUser.id, device, ipAddress);
  }

  private async revokeAllUserSessions(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });
  }

  async rotateRefreshToken(
    incomingRefreshToken: string,
    device: string,
    ipAddress: string,
  ) {
    if (!incomingRefreshToken) {
      throw new BadRequestException('Provide refresh token');
    }

    // Hash the incoming refresh token so it can be compared with the stored hash in the DB
    const hashedIncomingToken =
      this.cryptoService.hashToken(incomingRefreshToken);

    // Find the session that belongs to this refresh token
    const existingSession = await this.prisma.session.findUnique({
      where: { token: hashedIncomingToken },
      select: { userId: true, isRevoked: true, expiresAt: true },
    });

    if (!existingSession) {
      throw new NotFoundException('Session not found');
    }

    // If the token is already revoked or expired, this could be a reuse attack revoke all user sessions that are still active
    if (existingSession.isRevoked || existingSession.expiresAt < new Date()) {
      await this.revokeAllUserSessions(existingSession.userId);
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    // Generate a new access and refresh token for the user
    const {
      accessToken,
      refreshToken: newRefreshToken,
      expiresAt: newExpiresAt,
      refreshTokenTtlMs,
    } = this.createAuthTokens(existingSession.userId);

    const hashedNewRefreshToken = this.cryptoService.hashToken(newRefreshToken);

    // In one transaction — create the new session and revoke the old one
    await this.prisma.$transaction(async (tx) => {
      await this.createSession(
        {
          userId: existingSession.userId,
          token: hashedNewRefreshToken,
          device,
          ipAddress,
          expiresAt: newExpiresAt,
        },
        tx,
      );
      await tx.session.update({
        where: { token: hashedIncomingToken },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      });
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      refreshTokenTtlMs,
    };
  }

  async signOut(incomingRefreshToken: string) {
    if (!incomingRefreshToken) {
      throw new BadRequestException('Provide refresh token');
    }

    const hashedIncomingToken =
      this.cryptoService.hashToken(incomingRefreshToken);

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
