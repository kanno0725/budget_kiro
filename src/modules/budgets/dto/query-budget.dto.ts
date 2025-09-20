import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryBudgetDto {
  @ApiPropertyOptional({
    description: 'Filter by category',
    example: '食費'
  })
  @IsOptional()
  @IsString({ message: 'カテゴリは文字列である必要があります' })
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter by month (1-12)',
    example: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '月は整数である必要があります' })
  @Min(1, { message: '月は1以上である必要があります' })
  @Max(12, { message: '月は12以下である必要があります' })
  month?: number;

  @ApiPropertyOptional({
    description: 'Filter by year',
    example: 2024
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '年は整数である必要があります' })
  @Min(2000, { message: '年は2000以上である必要があります' })
  @Max(2100, { message: '年は2100以下である必要があります' })
  year?: number;
}