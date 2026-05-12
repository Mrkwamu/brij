/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Body, Controller, Headers, Ip, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './auth.dto';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../decorators/public.decorator';
import { VerifyAccountDto } from './types/auth.types';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private setRefreshTokenCookie(res: Response, token: string, maxAge: number) {
    const isProd = this.configService.get('NODE_ENV') === 'production';

    res.cookie('refreshToken', token, {
      maxAge: maxAge,
      secure: isProd,
      sameSite: 'strict',
      httpOnly: true,
      path: '/',
    });
  }

  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Ip() ipAddress: string,
    @Headers('User-Agent') device: string,
    @Res({ passthrough: true })
    res: Response,
  ) {
    const { accessToken, refreshToken, refreshTokenTtlMs } =
      await this.authService.registerUser(dto, device, ipAddress);

    this.setRefreshTokenCookie(res, refreshToken, refreshTokenTtlMs);

    return {
      message: 'Account created successfully',
      accessToken,
    };
  }

  @Public()
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Headers('User-Agent') device: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, refreshTokenTtlMs } =
      await this.authService.loginUser(dto, device, ip);
    this.setRefreshTokenCookie(res, refreshToken, refreshTokenTtlMs);
    return {
      message: 'Login successfully',
      accessToken,
    };
  }

  @Public()
  @Post('verify-account')
  async verifyAccount(@Body() data: VerifyAccountDto) {
    await this.authService.verifyAccount(data);
    return {
      message: 'Account verified successfully',
    };
  }

  @Public()
  @Post('resend-otp')
  async resendOtp(@Body('email') email: string) {
    await this.authService.resendEmail(email);
    return {
      message: 'Otp sent successfully',
    };
  }

  @Public()
  @Post('refresh')
  async refreshToken(
    @Ip() ipAddress: string,
    @Headers('user-agent') device: string,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const cookieRefreshToken = req.cookies['refreshToken'];

    const { accessToken, refreshToken, refreshTokenTtlMs } =
      await this.authService.rotateRefreshToken(
        cookieRefreshToken,
        device,
        ipAddress,
      );

    // set the new refresh token as a cookie for the next rotation
    this.setRefreshTokenCookie(res, refreshToken, refreshTokenTtlMs);

    return {
      message: 'Token rotated successfully',
      accessToken,
    };
  }

  @Post('logout')
  async signOut(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieRefreshToken = req.cookies['refreshToken'];

    await this.authService.signOut(cookieRefreshToken);
    res.clearCookie('refreshToken', { path: '/' });

    return { message: 'Logged out successfully' };
  }
}
