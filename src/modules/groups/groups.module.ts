import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';

@Module({
  controllers: [GroupsController],
  // Will be implemented in tasks 6-8
})
export class GroupsModule {}