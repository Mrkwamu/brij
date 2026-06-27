import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WorkSpaceDto {
  @ApiProperty({
    example: 'Brij',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name!: string;

  @ApiPropertyOptional({
    example: 'brij',
  })
  @IsString()
  @IsOptional()
  slug?: string;
}

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzM2I0OWViZS0xZDdmLTQ4ODgtYTg5Zi1lNjk0YzlmNDE3NjciLCJpYXQiOjE3ODI0MTQxNjUsImV4cCI6MTc4MjUwMDU2NSwiYXVkIjoidXNlcnMiLCJpc3MiOiJCcmlqIn0.5DbDKBDOzui1cZGVtWTQm77p1lAvn2oRtWw09I3UD6o
export class WorkspaceDataDto {
  @ApiProperty({
    example: 'Brij',
  })
  name!: string;

  @ApiProperty({
    example: 'brij',
  })
  slug!: string;

  @ApiProperty({
    required: false,
    example: '2026-06-25T19:14:07.833Z',
  })
  createdAt?: Date;
}
export class CreateWorkspaceResponseDto extends BaseResponseDto {
  @ApiProperty({
    type: WorkspaceDataDto,
  })
  data!: WorkspaceDataDto;
}

export class GetAllWorkspaceResponseDto extends BaseResponseDto {
  @ApiProperty({
    type: [WorkspaceDataDto],
    example: [
      {
        name: 'Paystack App',
        slug: 'paystack-app',
        createdAt: '2026-06-25T19:14:07.833Z',
      },
      {
        name: 'Brij',
        slug: 'brij',
        createdAt: '2026-06-26T10:30:00.000Z',
      },
    ],
  })
  data!: WorkspaceDataDto[];
}

export class ApiSummaryDto {
  @ApiProperty({
    example: 'api_Abc1DEF_2u',
  })
  publicId!: string;

  @ApiProperty({
    example: 'Billing',
  })
  name!: string;
}

export class GetWorkspaceDto extends WorkSpaceDto {
  @ApiProperty({
    type: [ApiSummaryDto],
  })
  apis!: ApiSummaryDto[];
}

export class GetWorkspaceResponseDto extends BaseResponseDto {
  @ApiProperty({
    type: GetWorkspaceDto,
  })
  data!: GetWorkspaceDto;
}

export class UpdateWorkspaceDataDto {
  @ApiProperty({
    example: 'Brij',
  })
  name!: string;

  @ApiProperty({
    example: '2026-06-26T10:30:00.000Z',
  })
  updatedAt!: Date;
}

export class UpdateWorkspaceResponseDto extends BaseResponseDto {
  @ApiProperty({
    type: UpdateWorkspaceDataDto,
  })
  data!: UpdateWorkspaceDataDto;
}
