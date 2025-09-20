import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExportService } from './export.service';
import { ExportQueryDto } from './dto/export-query.dto';

@Controller('api/export')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get()
  async exportData(
    @Query() query: ExportQueryDto,
    @Request() req,
    @Res() res: Response,
  ) {
    const userId = req.user.userId;
    let csvData: string;
    let filename: string;

    try {
      switch (query.type) {
        case 'transactions':
          csvData = await this.exportService.exportTransactions(userId, query);
          filename = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
          break;

        case 'budgets':
          csvData = await this.exportService.exportBudgets(userId, query);
          filename = `budgets_${new Date().toISOString().split('T')[0]}.csv`;
          break;

        case 'groups':
          if (!query.groupId) {
            throw new BadRequestException('Group ID is required for group export');
          }
          csvData = await this.exportService.exportGroupData(userId, query.groupId);
          filename = `group_${query.groupId}_${new Date().toISOString().split('T')[0]}.csv`;
          break;

        default:
          throw new BadRequestException('Invalid export type. Must be one of: transactions, budgets, groups');
      }

      // Set response headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Pragma', 'no-cache');

      // Send CSV data
      res.send(csvData);
    } catch (error) {
      throw error;
    }
  }

  @Get('transactions')
  async exportTransactions(
    @Query() query: ExportQueryDto,
    @Request() req,
    @Res() res: Response,
  ) {
    const userId = req.user.userId;
    
    try {
      const csvData = await this.exportService.exportTransactions(userId, query);
      const filename = `transactions_${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Pragma', 'no-cache');

      res.send(csvData);
    } catch (error) {
      throw error;
    }
  }

  @Get('budgets')
  async exportBudgets(
    @Query() query: ExportQueryDto,
    @Request() req,
    @Res() res: Response,
  ) {
    const userId = req.user.userId;
    
    try {
      const csvData = await this.exportService.exportBudgets(userId, query);
      const filename = `budgets_${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Pragma', 'no-cache');

      res.send(csvData);
    } catch (error) {
      throw error;
    }
  }

  @Get('groups/:groupId')
  async exportGroupData(
    @Query('groupId') groupId: string,
    @Request() req,
    @Res() res: Response,
  ) {
    const userId = req.user.userId;
    
    try {
      const csvData = await this.exportService.exportGroupData(userId, groupId);
      const filename = `group_${groupId}_${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Pragma', 'no-cache');

      res.send(csvData);
    } catch (error) {
      throw error;
    }
  }
}