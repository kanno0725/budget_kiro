import { IsOptional, IsString, IsDateString, IsEnum, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { TransactionType } from '@prisma/client';

export class QueryTransactionDto {
  @ApiPropertyOptional({
    description: 'Filter by category',
    example: '食費'
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter by transaction type',
    enum: TransactionType,
    example: TransactionType.EXPENSE
  })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({
    description: 'Start date for filtering (ISO format)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering (ISO format)',
    example: '2024-01-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  limit?: number = 10;
}