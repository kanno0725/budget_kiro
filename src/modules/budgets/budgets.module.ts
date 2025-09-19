import { Module } from '@nestjs/common';
import { BudgetsController } from './budgets.controller';

@Module({
  controllers: [BudgetsController],
  // Will be implemented in task 5
})
export class BudgetsModule {}