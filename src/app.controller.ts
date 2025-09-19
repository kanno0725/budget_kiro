import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from './database/prisma.service';
import { Public } from './modules/auth/decorators/public.decorator';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'API welcome message' })
  @ApiResponse({
    status: 200,
    description: 'Welcome message',
    schema: {
      example: {
        message: 'Household Budget API is running!',
        version: '1.0.0',
        timestamp: '2023-01-01T00:00:00.000Z'
      }
    }
  })
  getWelcome() {
    return {
      message: 'Household Budget API is running!',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    };
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check with database connectivity' })
  @ApiResponse({
    status: 200,
    description: 'Health status with database connectivity',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2023-01-01T00:00:00.000Z',
        database: 'connected'
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Health check failed',
    schema: {
      example: {
        status: 'error',
        timestamp: '2023-01-01T00:00:00.000Z',
        database: 'disconnected',
        error: 'Connection failed'
      }
    }
  })
  async getHealth() {
    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message,
      };
    }
  }
}