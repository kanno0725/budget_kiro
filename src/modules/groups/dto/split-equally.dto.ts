import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SplitEquallyDto {
  @ApiProperty({
    description: 'Array of user IDs to include in the equal split settlement',
    example: ['user_123', 'user_456', 'user_789']
  })
  @IsArray()
  @IsString({ each: true })
  userIds: string[];
}