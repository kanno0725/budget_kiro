import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Budgets')
@ApiBearerAuth('JWT-auth')
@Controller('budgets')
export class BudgetsController {
  @Get()
  @ApiOperation({ summary: 'Get all budgets' })
  @ApiResponse({
    status: 200,
    description: 'List of budgets retrieved successfully',
    schema: {
      example: {
        success: true,
        data: [],
        message: 'Feature not implemented yet'
      }
    }
  })
  async findAll() {
    return {
      success: true,
      data: [],
      message: 'Feature not implemented yet'
    };
  }
}