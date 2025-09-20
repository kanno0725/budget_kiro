import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ExportService } from './export.service';
import { PrismaService } from '../../database/prisma.service';
import { TransactionType, GroupRole } from '@prisma/client';

describe('ExportService', () => {
  let service: ExportService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    transaction: {
      findMany: jest.fn(),
    },
    budget: {
      findMany: jest.fn(),
    },
    group: {
      findUnique: jest.fn(),
    },
    groupMember: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ExportService>(ExportService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('exportTransactions', () => {
    it('should export transactions as CSV', async () => {
      const userId = 'user1';
      const mockTransactions = [
        {
          id: 'trans1',
          amount: 100.50,
          category: 'Food',
          description: 'Lunch',
          date: new Date('2024-01-15'),
          type: TransactionType.EXPENSE,
          createdAt: new Date('2024-01-15T10:00:00Z'),
          updatedAt: new Date('2024-01-15T10:00:00Z'),
          user: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.exportTransactions(userId, {});

      expect(result).toContain('ID,Amount,Category,Description,Date,Type,User Name,User Email,Created At,Updated At');
      expect(result).toContain('trans1,100.5,Food,Lunch,2024-01-15,EXPENSE,John Doe,john@example.com');
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { date: 'desc' },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      });
    });

    it('should filter transactions by date range', async () => {
      const userId = 'user1';
      const query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      await service.exportTransactions(userId, query);

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          date: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-01-31'),
          },
        },
        orderBy: { date: 'desc' },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      });
    });

    it('should filter transactions by category', async () => {
      const userId = 'user1';
      const query = { category: 'Food' };

      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      await service.exportTransactions(userId, query);

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          category: 'Food',
        },
        orderBy: { date: 'desc' },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      });
    });
  });

  describe('exportBudgets', () => {
    it('should export budgets as CSV', async () => {
      const userId = 'user1';
      const mockBudgets = [
        {
          id: 'budget1',
          category: 'Food',
          amount: 500,
          month: 1,
          year: 2024,
          user: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      mockPrismaService.budget.findMany.mockResolvedValue(mockBudgets);

      const result = await service.exportBudgets(userId, {});

      expect(result).toContain('ID,Category,Amount,Month,Year,User Name,User Email');
      expect(result).toContain('budget1,Food,500,1,2024,John Doe,john@example.com');
      expect(mockPrismaService.budget.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      });
    });

    it('should filter budgets by category', async () => {
      const userId = 'user1';
      const query = { category: 'Food' };

      mockPrismaService.budget.findMany.mockResolvedValue([]);

      await service.exportBudgets(userId, query);

      expect(mockPrismaService.budget.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          category: 'Food',
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      });
    });
  });

  describe('exportGroupData', () => {
    it('should export group data as CSV when user is member', async () => {
      const userId = 'user1';
      const groupId = 'group1';

      const mockMembership = {
        id: 'member1',
        userId,
        groupId,
        role: GroupRole.MEMBER,
      };

      const mockGroup = {
        id: groupId,
        name: 'Test Group',
        inviteCode: 'ABC123',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        members: [
          {
            user: {
              id: userId,
              name: 'John Doe',
              email: 'john@example.com',
            },
            role: GroupRole.MEMBER,
          },
        ],
        sharedExpenses: [
          {
            id: 'expense1',
            amount: 100,
            description: 'Dinner',
            date: new Date('2024-01-15'),
            createdAt: new Date('2024-01-15T19:00:00Z'),
            payer: {
              name: 'John Doe',
              email: 'john@example.com',
            },
            splits: [],
          },
        ],
        groupBalances: [
          {
            user: {
              name: 'John Doe',
              email: 'john@example.com',
            },
            balance: 50,
          },
        ],
      };

      mockPrismaService.groupMember.findUnique.mockResolvedValue(mockMembership);
      mockPrismaService.group.findUnique.mockResolvedValue(mockGroup);

      const result = await service.exportGroupData(userId, groupId);

      expect(result).toContain('GROUP INFORMATION');
      expect(result).toContain('GROUP MEMBERS');
      expect(result).toContain('SHARED EXPENSES');
      expect(result).toContain('GROUP BALANCES');
      expect(result).toContain('Test Group');
      expect(result).toContain('ABC123');
      expect(result).toContain('John Doe');
      expect(result).toContain('Dinner');
    });

    it('should throw ForbiddenException when user is not a member', async () => {
      const userId = 'user1';
      const groupId = 'group1';

      mockPrismaService.groupMember.findUnique.mockResolvedValue(null);

      await expect(service.exportGroupData(userId, groupId)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrismaService.groupMember.findUnique).toHaveBeenCalledWith({
        where: {
          userId_groupId: {
            userId,
            groupId,
          },
        },
      });
    });

    it('should throw NotFoundException when group does not exist', async () => {
      const userId = 'user1';
      const groupId = 'group1';

      const mockMembership = {
        id: 'member1',
        userId,
        groupId,
        role: GroupRole.MEMBER,
      };

      mockPrismaService.groupMember.findUnique.mockResolvedValue(mockMembership);
      mockPrismaService.group.findUnique.mockResolvedValue(null);

      await expect(service.exportGroupData(userId, groupId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('CSV formatting', () => {
    it('should properly escape CSV fields with commas', async () => {
      const userId = 'user1';
      const mockTransactions = [
        {
          id: 'trans1',
          amount: 100.50,
          category: 'Food',
          description: 'Lunch, dinner',
          date: new Date('2024-01-15'),
          type: TransactionType.EXPENSE,
          createdAt: new Date('2024-01-15T10:00:00Z'),
          updatedAt: new Date('2024-01-15T10:00:00Z'),
          user: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.exportTransactions(userId, {});

      expect(result).toContain('"Lunch, dinner"');
    });

    it('should properly escape CSV fields with quotes', async () => {
      const userId = 'user1';
      const mockTransactions = [
        {
          id: 'trans1',
          amount: 100.50,
          category: 'Food',
          description: 'John\'s "special" lunch',
          date: new Date('2024-01-15'),
          type: TransactionType.EXPENSE,
          createdAt: new Date('2024-01-15T10:00:00Z'),
          updatedAt: new Date('2024-01-15T10:00:00Z'),
          user: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.exportTransactions(userId, {});

      expect(result).toContain('"John\'s ""special"" lunch"');
    });
  });
});