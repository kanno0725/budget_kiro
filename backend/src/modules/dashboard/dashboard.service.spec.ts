import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../database/prisma.service';
import { TransactionType } from '@prisma/client';

describe('DashboardService', () => {
  let service: DashboardService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    transaction: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMonthlySummary', () => {
    it('should return monthly summary for current month when no parameters provided', async () => {
      const userId = 'user123';
      const mockIncomeSum = { _sum: { amount: 300000 } };
      const mockExpenseSum = { _sum: { amount: 180000 } };

      mockPrismaService.transaction.aggregate
        .mockResolvedValueOnce(mockIncomeSum)
        .mockResolvedValueOnce(mockExpenseSum);

      const result = await service.getMonthlySummary(userId);

      expect(result).toEqual({
        year: expect.any(Number),
        month: expect.any(Number),
        totalIncome: 300000,
        totalExpense: 180000,
        balance: 120000,
      });

      expect(mockPrismaService.transaction.aggregate).toHaveBeenCalledTimes(2);
    });

    it('should return monthly summary for specified year and month', async () => {
      const userId = 'user123';
      const year = 2024;
      const month = 1;
      const mockIncomeSum = { _sum: { amount: 250000 } };
      const mockExpenseSum = { _sum: { amount: 150000 } };

      mockPrismaService.transaction.aggregate
        .mockResolvedValueOnce(mockIncomeSum)
        .mockResolvedValueOnce(mockExpenseSum);

      const result = await service.getMonthlySummary(userId, year, month);

      expect(result).toEqual({
        year: 2024,
        month: 1,
        totalIncome: 250000,
        totalExpense: 150000,
        balance: 100000,
      });
    });

    it('should handle null amounts from database', async () => {
      const userId = 'user123';
      const mockIncomeSum = { _sum: { amount: null } };
      const mockExpenseSum = { _sum: { amount: null } };

      mockPrismaService.transaction.aggregate
        .mockResolvedValueOnce(mockIncomeSum)
        .mockResolvedValueOnce(mockExpenseSum);

      const result = await service.getMonthlySummary(userId);

      expect(result).toEqual({
        year: expect.any(Number),
        month: expect.any(Number),
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
      });
    });
  });

  describe('getCategoryExpenses', () => {
    it('should return category expenses with percentages', async () => {
      const userId = 'user123';
      const mockCategoryData = [
        { category: '食費', _sum: { amount: 50000 } },
        { category: '交通費', _sum: { amount: 30000 } },
        { category: '娯楽費', _sum: { amount: 20000 } },
      ];

      mockPrismaService.transaction.groupBy.mockResolvedValue(mockCategoryData);

      const result = await service.getCategoryExpenses(userId);

      expect(result).toEqual([
        { category: '食費', amount: 50000, percentage: 50 },
        { category: '交通費', amount: 30000, percentage: 30 },
        { category: '娯楽費', amount: 20000, percentage: 20 },
      ]);

      expect(mockPrismaService.transaction.groupBy).toHaveBeenCalledWith({
        by: ['category'],
        where: {
          userId,
          type: TransactionType.EXPENSE,
          date: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      });
    });

    it('should handle empty category data', async () => {
      const userId = 'user123';
      mockPrismaService.transaction.groupBy.mockResolvedValue([]);

      const result = await service.getCategoryExpenses(userId);

      expect(result).toEqual([]);
    });

    it('should use custom date range when provided', async () => {
      const userId = 'user123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const mockCategoryData = [
        { category: '食費', _sum: { amount: 25000 } },
      ];

      mockPrismaService.transaction.groupBy.mockResolvedValue(mockCategoryData);

      const result = await service.getCategoryExpenses(userId, startDate, endDate);

      expect(result).toEqual([
        { category: '食費', amount: 25000, percentage: 100 },
      ]);

      expect(mockPrismaService.transaction.groupBy).toHaveBeenCalledWith({
        by: ['category'],
        where: {
          userId,
          type: TransactionType.EXPENSE,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      });
    });
  });

  describe('getMonthlyTrends', () => {
    it('should return monthly trends for specified number of months', async () => {
      const userId = 'user123';
      const months = 3;

      // Mock aggregate calls for each month
      mockPrismaService.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 300000 } }) // Income month 1
        .mockResolvedValueOnce({ _sum: { amount: 180000 } }) // Expense month 1
        .mockResolvedValueOnce({ _sum: { amount: 280000 } }) // Income month 2
        .mockResolvedValueOnce({ _sum: { amount: 170000 } }) // Expense month 2
        .mockResolvedValueOnce({ _sum: { amount: 320000 } }) // Income month 3
        .mockResolvedValueOnce({ _sum: { amount: 190000 } }); // Expense month 3

      const result = await service.getMonthlyTrends(userId, months);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        year: expect.any(Number),
        month: expect.any(Number),
        income: 300000,
        expense: 180000,
        balance: 120000,
        date: expect.stringMatching(/^\d{4}-\d{2}$/),
      });

      expect(mockPrismaService.transaction.aggregate).toHaveBeenCalledTimes(6); // 2 calls per month
    });

    it('should default to 12 months when no parameter provided', async () => {
      const userId = 'user123';

      // Mock 24 calls (12 months * 2 calls per month)
      for (let i = 0; i < 24; i++) {
        mockPrismaService.transaction.aggregate.mockResolvedValueOnce({ _sum: { amount: 100000 } });
      }

      const result = await service.getMonthlyTrends(userId);

      expect(result).toHaveLength(12);
      expect(mockPrismaService.transaction.aggregate).toHaveBeenCalledTimes(24);
    });
  });

  describe('getDashboardData', () => {
    it('should return comprehensive dashboard data', async () => {
      const userId = 'user123';
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      // Mock aggregate calls for summary
      mockPrismaService.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 300000 } }) // Income
        .mockResolvedValueOnce({ _sum: { amount: 180000 } }) // Expense
        .mockResolvedValueOnce({ _sum: { amount: 300000 } }) // Income for trends
        .mockResolvedValueOnce({ _sum: { amount: 180000 } }); // Expense for trends

      // Mock category data
      mockPrismaService.transaction.groupBy.mockResolvedValue([
        { category: '食費', _sum: { amount: 90000 } },
        { category: '交通費', _sum: { amount: 90000 } },
      ]);

      const result = await service.getDashboardData(userId, startDate, endDate);

      expect(result).toEqual({
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
          { category: '食費', amount: 90000, percentage: 50 },
          { category: '交通費', amount: 90000, percentage: 50 },
        ],
        monthlyTrends: expect.any(Array),
      });
    });

    it('should use default dates when not provided', async () => {
      const userId = 'user123';

      // Mock aggregate calls
      mockPrismaService.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 200000 } })
        .mockResolvedValueOnce({ _sum: { amount: 120000 } })
        .mockResolvedValueOnce({ _sum: { amount: 200000 } })
        .mockResolvedValueOnce({ _sum: { amount: 120000 } });

      mockPrismaService.transaction.groupBy.mockResolvedValue([]);

      const result = await service.getDashboardData(userId);

      expect(result.summary.totalIncome).toBe(200000);
      expect(result.summary.totalExpense).toBe(120000);
      expect(result.summary.balance).toBe(80000);
      expect(result.summary.period.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.summary.period.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});