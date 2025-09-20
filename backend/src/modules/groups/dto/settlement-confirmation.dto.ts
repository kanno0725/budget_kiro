import { IsBoolean, IsOptional, IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SettlementConfirmationDto {
  @ApiProperty({
    description: 'Confirmation that the user wants to proceed with the settlement',
    example: true
  })
  @IsBoolean()
  confirmed: boolean;

  @ApiProperty({
    description: 'Optional array of user IDs to include in settlement. If not provided, all group members will be included',
    example: ['user_123', 'user_456'],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userIds?: string[];
}