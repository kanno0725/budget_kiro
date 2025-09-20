import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Transactions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Transaction created successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 'clx1234567890',
          amount: 1500.50,
          category: '食費',
          description: 'スーパーでの買い物',
          date: '2024-01-15T00:00:00.000Z',
          type: 'EXPENSE',
          userId: 'user123',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z'
        },
        message: '取引が正常に作成されました'
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    schema: {
      example: {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'バリデーションエラー',
          details: ['金額は必須です', 'カテゴリは必須です']
        }
      }
    }
  })
  async create(@Body() createTransactionDto: CreateTransactionDto, @CurrentUser() user: any) {
    const transaction = await this.transactionsService.create(user.id, createTransactionDto);
    return {
      success: true,
      data: transaction,
      message: '取引が正常に作成されました'
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all transactions with filtering and pagination' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'type', required: false, enum: ['INCOME', 'EXPENSE'], description: 'Filter by transaction type' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for filtering (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for filtering (ISO format)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of transactions retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          data: [
            {
              id: 'clx1234567890',
              amount: 1500.50,
              category: '食費',
              description: 'スーパーでの買い物',
              date: '2024-01-15T00:00:00.000Z',
              type: 'EXPENSE',
              userId: 'user123',
              createdAt: '2024-01-15T10:30:00.000Z',
              updatedAt: '2024-01-15T10:30:00.000Z'
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1
          }
        },
        message: '取引一覧を正常に取得しました'
      }
    }
  })
  async findAll(@Query() query: QueryTransactionDto, @CurrentUser() user: any) {
    const result = await this.transactionsService.findAll(user.id, query);
    return {
      success: true,
      data: result,
      message: '取引一覧を正常に取得しました'
    };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all unique categories for the user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categories retrieved successfully',
    schema: {
      example: {
        success: true,
        data: ['食費', '交通費', '娯楽費', '光熱費'],
        message: 'カテゴリ一覧を正常に取得しました'
      }
    }
  })
  async getCategories(@CurrentUser() user: any) {
    const categories = await this.transactionsService.getCategories(user.id);
    return {
      success: true,
      data: categories,
      message: 'カテゴリ一覧を正常に取得しました'
    };
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get transaction summary (income, expense, balance)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for summary (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for summary (ISO format)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction summary retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          totalIncome: 5000.00,
          totalExpense: 3500.50,
          balance: 1499.50
        },
        message: '取引サマリーを正常に取得しました'
      }
    }
  })
  async getSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any
  ) {
    const summary = await this.transactionsService.getSummary(user.id, startDate, endDate);
    return {
      success: true,
      data: summary,
      message: '取引サマリーを正常に取得しました'
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific transaction by ID' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 'clx1234567890',
          amount: 1500.50,
          category: '食費',
          description: 'スーパーでの買い物',
          date: '2024-01-15T00:00:00.000Z',
          type: 'EXPENSE',
          userId: 'user123',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z'
        },
        message: '取引を正常に取得しました'
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Transaction not found',
    schema: {
      example: {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '取引が見つかりません'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
    schema: {
      example: {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'この取引にアクセスする権限がありません'
        }
      }
    }
  })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const transaction = await this.transactionsService.findOne(id, user.id);
    return {
      success: true,
      data: transaction,
      message: '取引を正常に取得しました'
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction updated successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 'clx1234567890',
          amount: 1600.00,
          category: '食費',
          description: 'スーパーでの買い物（更新済み）',
          date: '2024-01-15T00:00:00.000Z',
          type: 'EXPENSE',
          userId: 'user123',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T11:00:00.000Z'
        },
        message: '取引が正常に更新されました'
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Transaction not found'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied'
  })
  async update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @CurrentUser() user: any
  ) {
    const transaction = await this.transactionsService.update(id, user.id, updateTransactionDto);
    return {
      success: true,
      data: transaction,
      message: '取引が正常に更新されました'
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transaction' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction deleted successfully',
    schema: {
      example: {
        success: true,
        data: null,
        message: '取引が正常に削除されました'
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Transaction not found'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied'
  })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    const result = await this.transactionsService.remove(id, user.id);
    return {
      success: true,
      data: null,
      message: result.message
    };
  }
}