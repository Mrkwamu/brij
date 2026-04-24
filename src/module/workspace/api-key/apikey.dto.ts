import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class createApiKeyDto {
  @IsOptional()
  @IsString()
  @Length(3, 8, {
    message: 'Prefix must be between 3 and 8 characters',
  })
  prefix!: string;

  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @IsString()
  @IsOptional()
  keyName!: string;

  @IsInt()
  @IsOptional()
  limit?: number;

  @IsInt()
  @IsOptional()
  window?: number;
}
