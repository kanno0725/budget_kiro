import { IsNotEmpty, IsString, IsNumber, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Transaction amount (positive for income, negative for expense)',
    example: 1500.50
  })
  @IsNotEmpty({ message: '金額は必須です' })
  @Type(() => Number)
  @IsNumber({}, { message: '金額は有効な数値である必要があります' })
  amount: number;

  @ApiProperty({
    description: 'Transaction category',
    example: '食費'
  })
  @IsNotEmpty({ message: 'カテゴリは必須です' })
  @IsString({ message: 'カテゴリは文字列である必要があります' })
  category: string;

  @ApiPropertyOptional({
    description: 'Transaction description',
    example: 'スーパーでの買い物'
  })
  @IsOptional()
  @IsString({ message: '説明は文字列である必要があります' })
  description?: string;

  @ApiProperty({
    description: 'Transaction date in ISO format',
    example: '2024-01-15T00:00:00.000Z'
  })
  @IsNotEmpty({ message: '日付は必須です' })
  @IsDateString({}, { message: '日付は有効なISO形式である必要があります' })
  date: string;

  @ApiPropertyOptional({
    description: 'Transaction type (will be auto-determined if not provided)',
    enum: TransactionType,
    example: TransactionType.EXPENSE
  })
  @IsOptional()
  @IsEnum(TransactionType, { message: '取引タイプはINCOMEまたはEXPENSEである必要があります' })
  type?: TransactionType;
}