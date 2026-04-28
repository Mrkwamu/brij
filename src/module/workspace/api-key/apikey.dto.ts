import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class createApiKeyDto {
  @IsOptional()
  @IsString()
  @Length(3, 8, {
    message: 'Prefix must be between 3 and 8 characters',
  })
  prefix!: string;

  @IsString()
  @IsOptional()
  @Length(3, 15, {
    message: 'Prefix must be between 3 and 12 characters',
  })
  keyName!: string;

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
}
