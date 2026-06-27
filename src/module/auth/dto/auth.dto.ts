/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class RegisterDto {
  @ApiProperty({
    example: 'jeffreyfestus1@gmail.com',
    format: 'email',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'Jeffrey Festus',
    minLength: 3,
    description: 'Full name of the user',
  })
  @IsString()
  @MinLength(3)
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'Password123',
    minLength: 6,
    description: 'Account password (min 6 characters)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}

export class LoginDto {
  @ApiProperty({
    example: 'jeffreyfestus1@gmail.com',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'Password123',
    description: 'Account Password',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}

export class VerifyAccountDto {
  @ApiProperty({
    example: 'jeffreyfestus1@gmail.com',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: '123456',
    minimum: 100000,
    maximum: 999999,
  })
  @IsInt()
  @Min(100000)
  @Max(999999)
  otp!: number;
}

export class ResendOtpDto {
  @ApiProperty({
    example: 'jeffreyfestus1@gmail.com',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

export class AuthDataDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIs...',
  })
  accessToken!: string;
}

export class AuthResponseDto extends BaseResponseDto {
  @ApiProperty({
    type: AuthDataDto,
  })
  data!: AuthDataDto;
}

export class ResendOtpResponseDto extends BaseResponseDto {
  @ApiProperty({
    example: 123456,
  })
  data!: number;
}
