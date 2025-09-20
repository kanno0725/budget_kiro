import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GroupRole } from '@prisma/client';

export class UpdateMemberRoleDto {
  @ApiProperty({
    description: 'New role for the member',
    enum: GroupRole,
    example: GroupRole.ADMIN
  })
  @IsEnum(GroupRole)
  role: GroupRole;
}