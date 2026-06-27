import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../../common/dto/base-response.dto';

export class VerifyDto {
  @ApiPropertyOptional({})
  namespace!: string;

  @ApiPropertyOptional({})
  identifier!: string;
}

export class VerifyData {
  @ApiProperty({
    example: true,
  })
  allowed!: boolean;

  @ApiProperty({
    example: 'api_Bbc1DEF_2u',
    description: 'Api key public ID',
  })
  publicId!: string;

  @ApiProperty({
    type: [String],
    example: ['payments:read', 'payments:write'],
    required: false,
  })
  permission?: string[];

  @ApiProperty({
    example: 999,
    description: 'Total request request in the time window',
  })
  remaining?: number;

  @ApiProperty({
    example: 1000,
    nullable: true,
    description: 'Maximum requests allowed within the window',
  })
  limit?: number;

  @ApiProperty({
    example: 1751036400,
    description: 'Unix timestamp when the current rate limit window resets',
  })
  resetAt!: number;
}

export class VerifyResponseDto extends BaseResponseDto {
  @ApiProperty({ type: VerifyData })
  data!: VerifyData;
}
