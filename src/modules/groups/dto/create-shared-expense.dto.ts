import { IsString, IsNotEmpty, IsDecimal, IsDateString, IsArray, ValidateNested, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';

export enum SplitType {
  EQUAL = 'EQUAL',
  CUSTOM = 'CUSTOM'
}

export class ExpenseSplitDto {
  @ApiProperty({
    description: 'User ID for the split',
    example: 'user_123'
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Amount for this user (required for custom split)',
    example: 25.50,
    required: false
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' }, { message: 'Amount must be a valid decimal with up to 2 decimal places' })
  amount?: number;
}

export class CreateSharedExpenseDto {
  @ApiProperty({
    description: 'Total amount of the expense',
    example: 100.00
  })
  @IsDecimal({ decimal_digits: '0,2' }, { message: 'Amount must be a valid decimal with up to 2 decimal places' })
  amount: number;

  @ApiProperty({
    description: 'Description of the expense',
    example: 'Dinner at restaurant'
  })
  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  @Transform(({ value }) => value?.trim())
  description: string;

  @ApiProperty({
    description: 'Date of the expense',
    example: '2024-01-15T19:30:00.000Z'
  })
  @IsDateString({}, { message: 'Date must be a valid ISO date string' })
  date: string;

  @ApiProperty({
    description: 'Type of split (equal or custom)',
    enum: SplitType,
    example: SplitType.EQUAL
  })
  @IsEnum(SplitType)
  splitType: SplitType;

  @ApiProperty({
    description: 'Array of expense splits',
    type: [ExpenseSplitDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpenseSplitDto)
  splits: ExpenseSplitDto[];
}