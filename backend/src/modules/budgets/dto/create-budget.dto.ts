import { IsNotEmpty, IsString, IsNumber, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBudgetDto {
  @ApiProperty({
    description: 'Budget category',
    example: '食費'
  })
  @IsNotEmpty({ message: 'カテゴリは必須です' })
  @IsString({ message: 'カテゴリは文字列である必要があります' })
  category: string;

  @ApiProperty({
    description: 'Budget amount',
    example: 50000
  })
  @IsNotEmpty({ message: '予算額は必須です' })
  @Type(() => Number)
  @IsNumber({}, { message: '予算額は有効な数値である必要があります' })
  @Min(0, { message: '予算額は0以上である必要があります' })
  amount: number;

  @ApiProperty({
    description: 'Budget month (1-12)',
    example: 1
  })
  @IsNotEmpty({ message: '月は必須です' })
  @Type(() => Number)
  @IsInt({ message: '月は整数である必要があります' })
  @Min(1, { message: '月は1以上である必要があります' })
  @Max(12, { message: '月は12以下である必要があります' })
  month: number;

  @ApiProperty({
    description: 'Budget year',
    example: 2024
  })
  @IsNotEmpty({ message: '年は必須です' })
  @Type(() => Number)
  @IsInt({ message: '年は整数である必要があります' })
  @Min(2000, { message: '年は2000以上である必要があります' })
  @Max(2100, { message: '年は2100以下である必要があります' })
  year: number;
}