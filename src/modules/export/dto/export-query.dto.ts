import { IsOptional, IsString, IsDateString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class ExportQueryDto {
  @IsOptional()
  @IsIn(['transactions', 'budgets', 'groups'])
  type?: 'transactions' | 'budgets' | 'groups';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  groupId?: string;
}