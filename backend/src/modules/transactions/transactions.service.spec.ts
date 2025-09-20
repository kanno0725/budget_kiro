import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { TransactionType } from '@prisma/client';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    transaction: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  const mockUser = {
    id: 'user123',
    name: 'Test User',
    email: 'test@example.com',
  };

  const mockTransaction = {
    id: 'transaction123',
    amount: 1500.50,
    category: '食費',
    description: 'スーパーでの買い物',
    date: new Date('2024-01-15'),
    type: TransactionType.EXPENSE,
    userId: 'user123',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a transaction with auto-determined type (expense)', async () => {
      const createDto = {
        amount: -1500.50,
        category: '食費',
        description: 'スーパーでの買い物',
        date: '2024-01-15T00:00:00.000Z',
      };

      mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);

      const result = await service.create('user123', createDto);

      expect(mockPrismaService.transaction.create).toHaveBeenCalledWith({
        data: {
          amount: 1500.50, // Converted to absolute value
          category: '食費',
          description: 'スーパーでの買い物',
          date: new Date('2024-01-15T00:00:00.000Z'),
          type: TransactionType.EXPENSE, // Auto-determined
          userId: 'user123',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should create a transaction with auto-determined type (income)', async () => {
      const createDto = {
        amount: 5000,
        category: '給与',
        description: '月給',
        date: '2024-01-15T00:00:00.000Z',
      };

      const incomeTransaction = { ...mockTransaction, type: TransactionType.INCOME };
      mockPrismaService.transaction.create.mockResolvedValue(incomeTransaction);

      const result = await service.create('user123', createDto);

      expect(mockPrismaService.transaction.create).toHaveBeenCalledWith({
        data: {
          amount: 5000,
          category: '給与',
          description: '月給',
          date: new Date('2024-01-15T00:00:00.000Z'),
          type: TransactionType.INCOME,
          userId: 'user123',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      expect(result).toEqual(incomeTransaction);
    });

    it('should create a transaction with explicit type', async () => {
      const createDto = {
        amount: 1500.50,
        category: '食費',
        description: 'スーパーでの買い物',
        date: '2024-01-15T00:00:00.000Z',
        type: TransactionType.EXPENSE,
      };

      mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);

      const result = await service.create('user123', createDto);

      expect(mockPrismaService.transaction.create).toHaveBeenCalledWith({
        data: {
          amount: 1500.50,
          category: '食費',
          description: 'スーパーでの買い物',
          date: new Date('2024-01-15T00:00:00.000Z'),
          type: TransactionType.EXPENSE,
          userId: 'user123',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      expect(result).toEqual(mockTransaction);
    });
  });

  describe('findAll', () => {
    it('should return paginated transactions with filters', async () => {
      const query = {
        category: '食費',
        type: TransactionType.EXPENSE,
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T23:59:59.999Z',
        page: 1,
        limit: 10,
      };

      const mockTransactions = [mockTransaction];
      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);
      mockPrismaService.transaction.count.mockResolvedValue(1);

      const result = await service.findAll('user123', query);

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user123',
          category: { contains: '食費', mode: 'insensitive' },
          type: TransactionType.EXPENSE,
          date: {
            gte: new Date('2024-01-01T00:00:00.000Z'),
            lte: new Date('2024-01-31T23:59:59.999Z'),
          },
        },
        orderBy: { date: 'desc' },
        skip: 0,
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      expect(result).toEqual({
        data: mockTransactions,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it('should return transactions without filters', async () => {
      const query = { page: 1, limit: 10 };
      const mockTransactions = [mockTransaction];
      
      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);
      mockPrismaService.transaction.count.mockResolvedValue(1);

      const result = await service.findAll('user123', query);

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        orderBy: { date: 'desc' },
        skip: 0,
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      expect(result.data).toEqual(mockTransactions);
    });
  });

  describe('findOne', () => {
    it('should return a transaction when found and user owns it', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(mockTransaction);

      const result = await service.findOne('transaction123', 'user123');

      expect(mockPrismaService.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: 'transaction123' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'user123')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException when user does not own transaction', async () => {
      const otherUserTransaction = { ...mockTransaction, userId: 'otherUser' };
      mockPrismaService.transaction.findUnique.mockResolvedValue(otherUserTransaction);

      await expect(service.findOne('transaction123', 'user123')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('update', () => {
    it('should update a transaction successfully', async () => {
      const updateDto = {
        amount: 1600,
        category: '食費',
        description: '更新された説明',
      };

      mockPrismaService.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrismaService.transaction.update.mockResolvedValue({
        ...mockTransaction,
        ...updateDto,
      });

      const result = await service.update('transaction123', 'user123', updateDto);

      expect(mockPrismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: 'transaction123' },
        data: {
          amount: 1600,
          category: '食費',
          description: '更新された説明',
          type: TransactionType.INCOME, // Auto-determined from positive amount
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      expect(result).toEqual({ ...mockTransaction, ...updateDto });
    });

    it('should auto-determine type when updating amount without type', async () => {
      const updateDto = { amount: -2000 };

      mockPrismaService.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrismaService.transaction.update.mockResolvedValue({
        ...mockTransaction,
        amount: 2000,
        type: TransactionType.EXPENSE,
      });

      await service.update('transaction123', 'user123', updateDto);

      expect(mockPrismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: 'transaction123' },
        data: {
          amount: 2000, // Converted to absolute
          type: TransactionType.EXPENSE, // Auto-determined
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });
  });

  describe('remove', () => {
    it('should delete a transaction successfully', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrismaService.transaction.delete.mockResolvedValue(mockTransaction);

      const result = await service.remove('transaction123', 'user123');

      expect(mockPrismaService.transaction.delete).toHaveBeenCalledWith({
        where: { id: 'transaction123' },
      });
      expect(result).toEqual({ message: '取引が正常に削除されました' });
    });
  });

  describe('getCategories', () => {
    it('should return unique categories for user', async () => {
      const mockCategories = [
        { category: '食費' },
        { category: '交通費' },
        { category: '娯楽費' },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(mockCategories);

      const result = await service.getCategories('user123');

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      });
      expect(result).toEqual(['食費', '交通費', '娯楽費']);
    });
  });

  describe('getSummary', () => {
    it('should return transaction summary', async () => {
      mockPrismaService.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 5000 } }) // Income
        .mockResolvedValueOnce({ _sum: { amount: 3500 } }); // Expense

      const result = await service.getSummary('user123');

      expect(result).toEqual({
        totalIncome: 5000,
        totalExpense: 3500,
        balance: 1500,
      });
    });

    it('should return summary with date filters', async () => {
      mockPrismaService.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 3000 } })
        .mockResolvedValueOnce({ _sum: { amount: 2000 } });

      const result = await service.getSummary(
        'user123',
        '2024-01-01T00:00:00.000Z',
        '2024-01-31T23:59:59.999Z'
      );

      expect(mockPrismaService.transaction.aggregate).toHaveBeenCalledWith({
        where: {
          userId: 'user123',
          type: TransactionType.INCOME,
          date: {
            gte: new Date('2024-01-01T00:00:00.000Z'),
            lte: new Date('2024-01-31T23:59:59.999Z'),
          },
        },
        _sum: { amount: true },
      });

      expect(result).toEqual({
        totalIncome: 3000,
        totalExpense: 2000,
        balance: 1000,
      });
    });
  });
});