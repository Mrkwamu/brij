/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Body, Controller, Headers, Ip, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';

import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../decorators/public.decorator';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiProtectedErrors,
  ApiCommonErrors,
  ApiConflict,
  ApiSuccess,
} from '../../decorators/swagger/api-response.decorator';
import { BaseResponseDto } from '../../common/dto/base-response.dto';
import {
  AuthResponseDto,
  RegisterDto,
  LoginDto,
  VerifyAccountDto,
  ResendOtpResponseDto,
  ResendOtpDto,
} from './dto/auth.dto';

@Controller('auth')
@ApiTags('Authentication')
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
      sameSite: isProd ? 'none' : 'strict',
      httpOnly: true,
      path: '/',
    });
  }

  @ApiOperation({
    summary: 'Registers a new user account',
  })
  @ApiSuccess('created', 'Account created successfully', AuthResponseDto)
  @ApiConflict('Email already exists')
  @ApiCommonErrors()
  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Ip() ipAddress: string,
    @Headers('User-Agent') device: string,
    @Res({ passthrough: true })
    res: Response,
  ): Promise<AuthResponseDto> {
    const { accessToken, refreshToken, refreshTokenTtlMs } =
      await this.authService.registerUser(dto, device, ipAddress);

    this.setRefreshTokenCookie(res, refreshToken, refreshTokenTtlMs);

    return {
      success: true,
      message: 'Account created successfully',
      data: {
        accessToken,
      },
    };
  }

  @ApiOperation({
    summary: 'Logs in a user and returns access token',
  })
  @ApiSuccess('ok', 'Login successful', AuthResponseDto)
  @ApiProtectedErrors()
  @Public()
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Headers('User-Agent') device: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const { accessToken, refreshToken, refreshTokenTtlMs } =
      await this.authService.loginUser(dto, device, ip);
    this.setRefreshTokenCookie(res, refreshToken, refreshTokenTtlMs);
    return {
      success: true,
      message: 'Login successfully',
      data: {
        accessToken,
      },
    };
  }

  @ApiOperation({
    summary: 'Verify account with OTP code',
  })
  @ApiSuccess('ok', 'Account verified', BaseResponseDto)
  @ApiProtectedErrors()
  @Public()
  @Post('verify-account')
  async verifyAccount(@Body() dto: VerifyAccountDto): Promise<BaseResponseDto> {
    await this.authService.verifyAccount(dto);
    return {
      success: true,
      message: 'Account verified successfully',
    };
  }

  @ApiOperation({
    summary: 'Resend OTP verification code',
  })
  @ApiSuccess('created', 'Otp has been sent to email', ResendOtpResponseDto)
  @ApiCommonErrors()
  @Public()
  @Post('resend-otp')
  async resendOtp(@Body() dto: ResendOtpDto): Promise<ResendOtpResponseDto> {
    const otpCode = await this.authService.resendEmail(dto);
    return {
      success: true,
      message: 'Otp sent successfully',
      data: otpCode,
    };
  }

  @ApiOperation({
    summary: 'Refresh access token using refresh token cookie',
  })
  @ApiSuccess('ok', 'Token rotated successfully', AuthResponseDto)
  @ApiProtectedErrors()
  @Public()
  @Post('refresh')
  async refreshToken(
    @Ip() ipAddress: string,
    @Headers('user-agent') device: string,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
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
      success: true,
      message: 'Token rotated successfully',
      data: {
        accessToken,
      },
    };
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Logout and invalidate current session',
  })
  @ApiSuccess('ok', 'Logout successful', BaseResponseDto)
  @ApiProtectedErrors()
  @Post('logout')
  async signOut(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<BaseResponseDto> {
    const cookieRefreshToken = req.cookies['refreshToken'];

    await this.authService.signOut(cookieRefreshToken);
    res.clearCookie('refreshToken', { path: '/' });

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }
}
