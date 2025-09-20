import { IsOptional, IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SettlementPreviewDto {
  @ApiProperty({
    description: 'Optional array of user IDs to include in settlement preview. If not provided, all group members will be included',
    example: ['user_123', 'user_456'],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userIds?: string[];
}