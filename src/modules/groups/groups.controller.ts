import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Groups')
@ApiBearerAuth('JWT-auth')
@Controller('groups')
export class GroupsController {
  @Get()
  @ApiOperation({ summary: 'Get all groups' })
  @ApiResponse({
    status: 200,
    description: 'List of groups retrieved successfully',
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