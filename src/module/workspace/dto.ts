import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class WorkSpaceDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name!: string;
}
