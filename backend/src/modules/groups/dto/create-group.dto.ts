import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateGroupDto {
  @ApiProperty({
    description: 'Group name',
    example: 'Family Budget',
    minLength: 1,
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty({ message: 'Group name is required' })
  @Transform(({ value }) => value?.trim())
  @MinLength(1, { message: 'Group name must be at least 1 character long' })
  @MaxLength(100, { message: 'Group name must not exceed 100 characters' })
  name: string;
}