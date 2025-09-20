import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinGroupDto {
  @ApiProperty({
    description: 'Group invite code',
    example: 'abc123def456'
  })
  @IsString()
  @IsNotEmpty()
  inviteCode: string;
}