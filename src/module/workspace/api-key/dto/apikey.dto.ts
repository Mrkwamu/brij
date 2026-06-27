import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiKeyEnv, ApiKeyStatus } from '../../../../../generated/prisma/enums';
import { gracePeriods, GracePeriod } from '../type/apikey.type';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../../common/dto/base-response.dto';

export class CreateApiDto {
  @ApiProperty({
    example: 'Brij Payment',
  })
  @Length(3, 18, {
    message: 'Api name must be between 3 and 18 characters',
  })
  @IsString()
  name!: string;
}

export class CreateApiData {
  @ApiProperty({
    example: 'api_Abc1DEF_2u',
    description: 'Public identifier of the Api container',
  })
  publicId!: string;

  @ApiProperty({
    example: 'Brij Payment',
    description: 'Display name of the Api container',
  })
  name!: string;

  @ApiProperty({
    required: false,
    example: '2026-06-25T19:14:07.833Z',
  })
  createdAt?: Date;
}

export class CreateApiResponseDto extends BaseResponseDto {
  @ApiProperty({ type: CreateApiData })
  data!: CreateApiData;
}

export class GetApisDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}

export class GetApisData {
  @ApiProperty({
    example: 'api_Abc1DEF_2u',
    description: 'Public identifier of the API container',
  })
  publicId!: string;

  @ApiProperty({
    example: 'Brij Payment',
    description: 'Display name of the API container',
  })
  name!: string;
}

export class GetApisResponseDto extends BaseResponseDto {
  @ApiProperty({
    type: GetApisData,
    isArray: true,
  })
  data!: GetApisData[];
}

export class ApiKeyDto {
  @ApiPropertyOptional({
    example: 'brij',
    description: 'Prefix used when generating the Api key',
  })
  @IsOptional()
  @IsString()
  @Length(3, 12, {
    message: 'Prefix must be between 3 and 8 characters',
  })
  prefix?: string;

  @ApiPropertyOptional({
    example: 'Production Key',
    description: 'A name for the Api key',
  })
  @IsString()
  @IsOptional()
  @Length(3, 25, {
    message: 'Api key must be between 3 and 25 characters',
  })
  keyName?: string;

  @ApiPropertyOptional({
    example: 1000,
    description: 'Maximum number of requests allowed within the time window',
  })
  @IsInt({ message: 'limit must be a whole number' })
  @Min(1, { message: 'limit must be at least 1 request' })
  @Max(10000, { message: 'limit cannot exceed 10000 requests' })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    example: 3600,
    description: 'Rate limit window in seconds',
  })
  @IsInt({ message: 'window must be a whole number (in seconds)' })
  @Min(1, { message: 'window must be at least 1 second' })
  @Max(86400, {
    message: 'window cannot exceed 86400 seconds (24 hours)',
  })
  @IsOptional()
  window?: number;

  @ApiPropertyOptional({
    example: ['payments:read', 'payments:write'],
    description: 'Permissions granted to the Api key',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayNotEmpty()
  scope?: string[];

  @ApiPropertyOptional({
    enum: ApiKeyEnv,
    example: ApiKeyEnv.development,
    description: 'Environment the Api key belongs to',
  })
  @IsOptional()
  @IsEnum(ApiKeyEnv)
  env?: ApiKeyEnv;

  @ApiPropertyOptional({
    example: '2026-12-31T23:59:59.000Z',
    description: 'Optional expiration date of the Api key',
  })
  @IsOptional()
  expiresAt?: Date;
}

export class CreateApiKeyData {
  @ApiProperty({
    example: 'brij_live_8Hd92KsLmPq4Xz',
    description: 'The generated Api key. This value is only returned once.',
  })
  key!: string;
}

export class CreateApiKeyResponseDto extends BaseResponseDto {
  @ApiProperty({
    type: CreateApiKeyData,
  })
  data!: CreateApiKeyData;
}

export class GetApiKeysDto {
  @ApiPropertyOptional({
    example: 10,
    description: 'Maximum number of Apikeys to return',
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(100)
  @Min(1)
  limit?: number;
}

export class ApiKeyPolicyData {
  @ApiProperty({
    example: 1000,
    nullable: true,
    description: 'Maximum requests allowed within the window',
  })
  limit!: number | null;

  @ApiProperty({
    example: 3600,
    nullable: true,
    description: 'Rate limit window in seconds',
  })
  window!: number | null;
}

export class GetApiKeyData {
  @ApiProperty({
    example: 'key_Abc1DEF_2u',
    description: 'Api key public ID',
  })
  publicId!: string;

  @ApiProperty({
    example: 'Production Key',
    description: 'Name of the API key',
  })
  keyName!: string;

  @ApiProperty({
    example: 'brij_live_8Hd92K',
    description: 'Visible prefix of the API key',
  })
  keyPrefix!: string;

  @ApiProperty({
    example: ['payments:read', 'payments:write'],
    type: [String],
  })
  permission!: string[];

  @ApiProperty({
    example: 'live',
  })
  environment!: string;

  @ApiProperty({
    required: false,
    example: '2026-06-26T15:30:00.000Z',
  })
  lastUsedAt!: Date | null;

  @ApiProperty({
    example: 'active',
  })
  status!: string;

  @ApiProperty({
    required: false,
    example: '2027-01-01T00:00:00.000Z',
  })
  expiresAt!: Date | null;

  @ApiProperty({
    example: '2026-06-26T15:30:00.000Z',
  })
  createdAt!: Date;
  @ApiProperty({
    type: ApiKeyPolicyData,
  })
  policies!: ApiKeyPolicyData | null;
}

export class GetApiKeysData {
  @ApiProperty({
    example: 'key_Abc1DEF_2u',
  })
  publicId!: string;

  @ApiProperty({
    example: 'Production Key',
  })
  keyName!: string;

  @ApiProperty({
    example: 'brij_live_8Hd92K',
  })
  keyPrefix!: string;

  @ApiProperty({
    example: 'active',
  })
  status!: string;

  @ApiProperty({
    required: false,
    example: '2026-06-26T15:30:00.000Z',
  })
  lastUsedAt!: Date | null;

  @ApiProperty({
    required: false,
    example: '2027-01-01T00:00:00.000Z',
  })
  expiresAt!: Date | null;
}

export class GetApiKeysResponseDto extends BaseResponseDto {
  @ApiProperty({
    type: GetApiKeysData,
    isArray: true,
  })
  data!: GetApiKeysData[];
}

export class GetApiKeyResponseDto extends BaseResponseDto {
  @ApiProperty({
    type: GetApiKeyData,
  })
  data!: GetApiKeyData;
}

export class UpdateApiKeyData {
  @ApiProperty({
    example: 'Production Key',
    description: 'Updated APi key name',
  })
  keyName!: string;

  @ApiProperty({
    example: ['payments:read', 'payments:write'],
    type: [String],
  })
  permission!: string[];

  @ApiProperty({
    required: false,
    nullable: true,
    example: '2027-01-01T00:00:00.000Z',
  })
  expiresAt!: Date | null;

  @ApiProperty({
    example: '2026-06-27T07:30:00.000Z',
  })
  updatedAt!: Date;

  @ApiProperty({
    type: ApiKeyPolicyData,
    required: false,
    nullable: true,
  })
  policies!: ApiKeyPolicyData | null;
}

export class UpdateApiKeyResponseDto extends BaseResponseDto {
  @ApiProperty({
    type: UpdateApiKeyData,
  })
  data!: UpdateApiKeyData;
}

export class RotateApiKeyDto {
  @ApiProperty({
    enum: gracePeriods,
    example: '1h',
    description: 'Grace period before the old API key is revoked',
  })
  @IsIn(gracePeriods)
  gracePeriod!: GracePeriod;
}

export class UpdateApiKeyStatusDto {
  @ApiProperty({
    enum: ApiKeyStatus,
    example: ApiKeyStatus.disabled,
  })
  @IsEnum(ApiKeyStatus)
  status?: ApiKeyStatus;
}

export class ApiKeyStatusData {
  @ApiProperty({
    enum: ApiKeyStatus,
    example: ApiKeyStatus.disabled,
  })
  status!: ApiKeyStatus;

  @ApiProperty({
    example: '2026-06-27T10:15:00.000Z',
  })
  updatedAt!: Date;
}

export class ApiKeyStatusResponseDto extends BaseResponseDto {
  @ApiProperty({
    type: ApiKeyStatusData,
  })
  data!: ApiKeyStatusData;
}

export class RotateApiKeyData {
  @ApiProperty({
    example: 'brij_live_xxxxxxxxxxxxxxxxxxxxxxxxx',
    description:
      'The newly generated API key. This value is only returned once',
  })
  apikey!: string;

  @ApiProperty({
    example: '1h',
  })
  gracePeriod!: GracePeriod;

  @ApiProperty({
    example: '2026-06-27T11:15:00.000Z',
  })
  revokeAt!: Date;
}

export class RotateApiKeyResponseDto extends BaseResponseDto {
  @ApiProperty({
    type: RotateApiKeyData,
  })
  data!: RotateApiKeyData;
}

export class RevokeApiKeyData {
  @ApiProperty({
    enum: ApiKeyStatus,
    example: ApiKeyStatus.revoked,
  })
  status!: ApiKeyStatus;

  @ApiProperty({
    example: '2026-06-27T08:00:00.000Z',
  })
  updatedAt!: Date;
}

export class RevokeApiKeyResponseDto extends BaseResponseDto {
  @ApiProperty({
    type: RevokeApiKeyData,
  })
  data!: RevokeApiKeyData;
}
