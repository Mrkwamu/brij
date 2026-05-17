import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiKeyEnv } from '../../../../generated/prisma/enums';

export class ApiKeyDto {
  @IsOptional()
  @IsString()
  @Length(3, 8, {
    message: 'Prefix must be between 3 and 8 characters',
  })
  prefix?: string;

  @IsString()
  @IsOptional()
  @Length(3, 20, {
    message: 'Api key must be between 3 and 20 characters',
  })
  keyname?: string;

  @IsInt({ message: 'limit must be a whole number' })
  @Min(1, { message: 'limit must be at least 1 request' })
  @Max(10000, { message: 'limit cannot exceed 10000 requests' })
  @IsOptional()
  limit?: number;

  @IsInt({ message: 'window must be a whole number (in seconds)' })
  @Min(1, { message: 'window must be at least 1 second' })
  @Max(86400, { message: 'window cannot exceed 86400 seconds (24 hours)' })
  @IsOptional()
  window?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayNotEmpty()
  scope?: string[];

  @IsOptional()
  @IsEnum(ApiKeyEnv)
  env?: ApiKeyEnv;

  @IsOptional()
  expiresAt?: Date;
}

export class GetApiKeysDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(100)
  @Min(1)
  limit?: number;
}
