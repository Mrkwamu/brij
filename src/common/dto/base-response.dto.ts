import { ApiProperty } from '@nestjs/swagger';

export class BaseResponseDto {
  @ApiProperty({
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    example: 'Operation successful',
  })
  message!: string;
}
