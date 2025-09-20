import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('monthly-summary')
  @ApiOperation({ summary: 'Get monthly income and expense summary' })
  @ApiQuery({ name: 'year', required: false, description: 'Target year', example: 2024 })
  @ApiQuery({ name: 'month', required: false, description: 'Target month (1-12)', example: 1 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Monthly summary retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          year: 2024,
          month: 1,
          totalIncome: 300000,
          totalExpense: 180000,
          balance: 120000,
        },
        message: '月次収支サマリーを正常に取得しました',
      },
    },
  })
  async getMonthlySummary(
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
    @Query('month', new ParseIntPipe({ optional: true })) month?: number,
    @CurrentUser() user?: any,
  ) {
    const summary = await this.dashboardService.getMonthlySummary(
      user.id,
      year,
      month,
    );
    return {
      success: true,
      data: summary,
      message: '月次収支サマリーを正常に取得しました',
    };
  }

  @Get('category-expenses')
  @ApiOperation({ summary: 'Get expense breakdown by category' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)', example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)', example: '2024-01-31' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category expenses retrieved successfully',
    schema: {
      example: {
        success: true,
        data: [
          {
            category: '食費',
            amount: 45000,
            percentage: 25.0,
          },
          {
            category: '交通費',
            amount: 30000,
            percentage: 16.67,
          },
          {
            category: '娯楽費',
            amount: 25000,
            percentage: 13.89,
          },
        ],
        message: 'カテゴリ別支出データを正常に取得しました',
      },
    },
  })
  async getCategoryExpenses(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any,
  ) {
    let start: Date | undefined;
    let end: Date | undefined;
    
    // 日付文字列の妥当性をチェック
    if (startDate) {
      const parsedStart = new Date(startDate);
      start = isNaN(parsedStart.getTime()) ? undefined : parsedStart;
    }
    
    if (endDate) {
      const parsedEnd = new Date(endDate);
      end = isNaN(parsedEnd.getTime()) ? undefined : parsedEnd;
    }
    
    const categoryExpenses = await this.dashboardService.getCategoryExpenses(
      user.id,
      start,
      end,
    );
    return {
      success: true,
      data: categoryExpenses,
      message: 'カテゴリ別支出データを正常に取得しました',
    };
  }

  @Get('monthly-trends')
  @ApiOperation({ summary: 'Get monthly income/expense trends' })
  @ApiQuery({ name: 'months', required: false, description: 'Number of months to retrieve', example: 12 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Monthly trends retrieved successfully',
    schema: {
      example: {
        success: true,
        data: [
          {
            year: 2023,
            month: 2,
            income: 280000,
            expense: 170000,
            balance: 110000,
            date: '2023-02',
          },
          {
            year: 2023,
            month: 3,
            income: 300000,
            expense: 180000,
            balance: 120000,
            date: '2023-03',
          },
        ],
        message: '月次推移データを正常に取得しました',
      },
    },
  })
  async getMonthlyTrends(
    @Query('months', new ParseIntPipe({ optional: true })) months?: number,
    @CurrentUser() user?: any,
  ) {
    const trends = await this.dashboardService.getMonthlyTrends(
      user.id,
      months,
    );
    return {
      success: true,
      data: trends,
      message: '月次推移データを正常に取得しました',
    };
  }

  @Get('data')
  @ApiOperation({ summary: 'Get comprehensive dashboard data for specified period' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)', example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)', example: '2024-01-31' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard data retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          summary: {
            totalIncome: 300000,
            totalExpense: 180000,
            balance: 120000,
            period: {
              startDate: '2024-01-01',
              endDate: '2024-01-31',
            },
          },
          categoryExpenses: [
            {
              category: '食費',
              amount: 45000,
              percentage: 25.0,
            },
          ],
          monthlyTrends: [
            {
              year: 2024,
              month: 1,
              income: 300000,
              expense: 180000,
              balance: 120000,
              date: '2024-01',
            },
          ],
        },
        message: 'ダッシュボードデータを正常に取得しました',
      },
    },
  })
  async getDashboardData(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any,
  ) {
    // 日付文字列の妥当性をチェック
    let validStartDate = startDate;
    let validEndDate = endDate;
    
    if (startDate) {
      const parsedStart = new Date(startDate);
      if (isNaN(parsedStart.getTime())) {
        validStartDate = undefined;
      }
    }
    
    if (endDate) {
      const parsedEnd = new Date(endDate);
      if (isNaN(parsedEnd.getTime())) {
        validEndDate = undefined;
      }
    }
    
    const dashboardData = await this.dashboardService.getDashboardData(
      user.id,
      validStartDate,
      validEndDate,
    );
    return {
      success: true,
      data: dashboardData,
      message: 'ダッシュボードデータを正常に取得しました',
    };
  }
}