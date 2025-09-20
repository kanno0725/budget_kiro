import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { Response } from 'express';

describe('ExportController', () => {
  let controller: ExportController;
  let exportService: ExportService;

  const mockExportService = {
    exportTransactions: jest.fn(),
    exportBudgets: jest.fn(),
    exportGroupData: jest.fn(),
  };

  const mockResponse = {
    setHeader: jest.fn(),
    send: jest.fn(),
  } as unknown as Response;

  const mockRequest = {
    user: { userId: 'user1' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExportController],
      providers: [
        {
          provide: ExportService,
          useValue: mockExportService,
        },
      ],
    }).compile();

    controller = module.get<ExportController>(ExportController);
    exportService = module.get<ExportService>(ExportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('exportData', () => {
    it('should export transactions when type is transactions', async () => {
      const query = { type: 'transactions' as const };
      const csvData = 'ID,Amount,Category\ntrans1,100,Food';
      
      mockExportService.exportTransactions.mockResolvedValue(csvData);

      await controller.exportData(query, mockRequest, mockResponse);

      expect(mockExportService.exportTransactions).toHaveBeenCalledWith('user1', query);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment; filename="transactions_')
      );
      expect(mockResponse.send).toHaveBeenCalledWith(csvData);
    });

    it('should export budgets when type is budgets', async () => {
      const query = { type: 'budgets' as const };
      const csvData = 'ID,Category,Amount\nbudget1,Food,500';
      
      mockExportService.exportBudgets.mockResolvedValue(csvData);

      await controller.exportData(query, mockRequest, mockResponse);

      expect(mockExportService.exportBudgets).toHaveBeenCalledWith('user1', query);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment; filename="budgets_')
      );
      expect(mockResponse.send).toHaveBeenCalledWith(csvData);
    });

    it('should export group data when type is groups', async () => {
      const query = { type: 'groups' as const, groupId: 'group1' };
      const csvData = 'GROUP INFORMATION\nField,Value\nGroup ID,group1';
      
      mockExportService.exportGroupData.mockResolvedValue(csvData);

      await controller.exportData(query, mockRequest, mockResponse);

      expect(mockExportService.exportGroupData).toHaveBeenCalledWith('user1', 'group1');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment; filename="group_group1_')
      );
      expect(mockResponse.send).toHaveBeenCalledWith(csvData);
    });

    it('should throw BadRequestException when type is groups but groupId is missing', async () => {
      const query = { type: 'groups' as const };

      await expect(
        controller.exportData(query, mockRequest, mockResponse)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid export type', async () => {
      const query = { type: 'invalid' as any };

      await expect(
        controller.exportData(query, mockRequest, mockResponse)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('exportTransactions', () => {
    it('should export transactions with proper headers', async () => {
      const query = { category: 'Food' };
      const csvData = 'ID,Amount,Category\ntrans1,100,Food';
      
      mockExportService.exportTransactions.mockResolvedValue(csvData);

      await controller.exportTransactions(query, mockRequest, mockResponse);

      expect(mockExportService.exportTransactions).toHaveBeenCalledWith('user1', query);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Pragma', 'no-cache');
      expect(mockResponse.send).toHaveBeenCalledWith(csvData);
    });

    it('should handle service errors', async () => {
      const query = {};
      const error = new Error('Database error');
      
      mockExportService.exportTransactions.mockRejectedValue(error);

      await expect(
        controller.exportTransactions(query, mockRequest, mockResponse)
      ).rejects.toThrow(error);
    });
  });

  describe('exportBudgets', () => {
    it('should export budgets with proper headers', async () => {
      const query = { category: 'Food' };
      const csvData = 'ID,Category,Amount\nbudget1,Food,500';
      
      mockExportService.exportBudgets.mockResolvedValue(csvData);

      await controller.exportBudgets(query, mockRequest, mockResponse);

      expect(mockExportService.exportBudgets).toHaveBeenCalledWith('user1', query);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Pragma', 'no-cache');
      expect(mockResponse.send).toHaveBeenCalledWith(csvData);
    });
  });

  describe('exportGroupData', () => {
    it('should export group data with proper headers', async () => {
      const groupId = 'group1';
      const csvData = 'GROUP INFORMATION\nField,Value\nGroup ID,group1';
      
      mockExportService.exportGroupData.mockResolvedValue(csvData);

      await controller.exportGroupData(groupId, mockRequest, mockResponse);

      expect(mockExportService.exportGroupData).toHaveBeenCalledWith('user1', groupId);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Pragma', 'no-cache');
      expect(mockResponse.send).toHaveBeenCalledWith(csvData);
    });

    it('should handle ForbiddenException from service', async () => {
      const groupId = 'group1';
      const error = new ForbiddenException('You are not a member of this group');
      
      mockExportService.exportGroupData.mockRejectedValue(error);

      await expect(
        controller.exportGroupData(groupId, mockRequest, mockResponse)
      ).rejects.toThrow(ForbiddenException);
    });
  });
});