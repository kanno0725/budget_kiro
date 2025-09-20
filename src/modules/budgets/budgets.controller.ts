import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { QueryBudgetDto } from './dto/query-budget.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Budgets')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new budget' })
  @ApiResponse({
    status: 201,
    description: 'Budget created successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 'clxxx',
          category: '食費',
          amount: 50000,
          month: 1,
          year: 2024,
          userId: 'clxxx'
        }
      }
    }
  })
  @ApiResponse({
    status: 409,
    description: 'Budget already exists for this category and period'
  })
  async create(@CurrentUser() user: any, @Body() createBudgetDto: CreateBudgetDto) {
    const budget = await this.budgetsService.create(user.id, createBudgetDto);
    return {
      success: true,
      data: budget,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all budgets' })
  @ApiResponse({
    status: 200,
    description: 'List of budgets retrieved successfully'
  })
  async findAll(@CurrentUser() user: any, @Query() query: QueryBudgetDto) {
    const budgets = await this.budgetsService.findAll(user.id, query);
    return {
      success: true,
      data: budgets,
    };
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get budget alerts (80% warning and 100% exceeded)' })
  @ApiQuery({ name: 'month', required: false, description: 'Month (1-12)' })
  @ApiQuery({ name: 'year', required: false, description: 'Year' })
  @ApiResponse({
    status: 200,
    description: 'Budget alerts retrieved successfully',
    schema: {
      example: {
        success: true,
        data: [
          {
            category: '食費',
            budgetAmount: 50000,
            actualAmount: 45000,
            percentage: 90,
            alertType: 'warning'
          }
        ]
      }
    }
  })
  async getBudgetAlerts(
    @CurrentUser() user: any,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    const alerts = await this.budgetsService.getBudgetAlerts(user.id, month, year);
    return {
      success: true,
      data: alerts,
    };
  }

  @Get('report')
  @ApiOperation({ summary: 'Get budget vs actual spending report' })
  @ApiQuery({ name: 'month', required: false, description: 'Month (1-12)' })
  @ApiQuery({ name: 'year', required: false, description: 'Year' })
  @ApiResponse({
    status: 200,
    description: 'Budget report retrieved successfully',
    schema: {
      example: {
        success: true,
        data: [
          {
            category: '食費',
            budgetAmount: 50000,
            actualAmount: 45000,
            remaining: 5000,
            percentage: 90,
            status: 'warning'
          }
        ]
      }
    }
  })
  async getBudgetReport(
    @CurrentUser() user: any,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    const report = await this.budgetsService.getBudgetReport(user.id, month, year);
    return {
      success: true,
      data: report,
    };
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get budget summary for a period' })
  @ApiQuery({ name: 'month', required: false, description: 'Month (1-12)' })
  @ApiQuery({ name: 'year', required: false, description: 'Year' })
  @ApiResponse({
    status: 200,
    description: 'Budget summary retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          month: 1,
          year: 2024,
          totalBudget: 150000,
          totalActual: 120000,
          totalRemaining: 30000,
          totalPercentage: 80,
          budgetCount: 5
        }
      }
    }
  })
  async getBudgetSummary(
    @CurrentUser() user: any,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    const summary = await this.budgetsService.getBudgetSummary(user.id, month, year);
    return {
      success: true,
      data: summary,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a budget by ID' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiResponse({
    status: 200,
    description: 'Budget retrieved successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Budget not found'
  })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const budget = await this.budgetsService.findOne(id, user.id);
    return {
      success: true,
      data: budget,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a budget' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiResponse({
    status: 200,
    description: 'Budget updated successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Budget not found'
  })
  @ApiResponse({
    status: 409,
    description: 'Budget already exists for this category and period'
  })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ) {
    const budget = await this.budgetsService.update(id, user.id, updateBudgetDto);
    return {
      success: true,
      data: budget,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a budget' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiResponse({
    status: 204,
    description: 'Budget deleted successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Budget not found'
  })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.budgetsService.remove(id, user.id);
  }
}