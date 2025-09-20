import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../database/prisma.service';
import { ExportModule } from './export.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransactionType, GroupRole } from '@prisma/client';

describe('Export Integration Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const mockJwtAuthGuard = {
    canActivate: jest.fn((context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      request.user = { userId: 'test-user-id' };
      return true;
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ExportModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Reset mock
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/export', () => {
    it('should export transactions as CSV', async () => {
      const mockTransactions = [
        {
          id: 'trans1',
          amount: 100.50,
          category: 'Food',
          description: 'Lunch',
          date: new Date('2024-01-15'),
          type: TransactionType.EXPENSE,
          userId: 'test-user-id',
          createdAt: new Date('2024-01-15T10:00:00Z'),
          updatedAt: new Date('2024-01-15T10:00:00Z'),
          user: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ] as any;

      jest.spyOn(prismaService.transaction, 'findMany').mockResolvedValue(mockTransactions);

      const response = await request(app.getHttpServer())
        .get('/api/export?type=transactions')
        .expect(200);

      expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(response.headers['content-disposition']).toMatch(/attachment; filename="transactions_/);
      expect(response.text).toContain('ID,Amount,Category,Description,Date,Type,User Name,User Email,Created At,Updated At');
      expect(response.text).toContain('trans1,100.5,Food,Lunch,2024-01-15,EXPENSE,John Doe,john@example.com');
    });

    it('should export budgets as CSV', async () => {
      const mockBudgets = [
        {
          id: 'budget1',
          category: 'Food',
          amount: 500,
          month: 1,
          year: 2024,
          userId: 'test-user-id',
          user: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ] as any;

      jest.spyOn(prismaService.budget, 'findMany').mockResolvedValue(mockBudgets);

      const response = await request(app.getHttpServer())
        .get('/api/export?type=budgets')
        .expect(200);

      expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(response.headers['content-disposition']).toMatch(/attachment; filename="budgets_/);
      expect(response.text).toContain('ID,Category,Amount,Month,Year,User Name,User Email');
      expect(response.text).toContain('budget1,Food,500,1,2024,John Doe,john@example.com');
    });

    it('should export group data as CSV', async () => {
      const mockMembership = {
        id: 'member1',
        userId: 'test-user-id',
        groupId: 'group1',
        role: GroupRole.MEMBER,
      };

      const mockGroup = {
        id: 'group1',
        name: 'Test Group',
        inviteCode: 'ABC123',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        members: [
          {
            user: {
              id: 'test-user-id',
              name: 'John Doe',
              email: 'john@example.com',
            },
            role: GroupRole.MEMBER,
          },
        ],
        sharedExpenses: [],
        groupBalances: [],
      };

      jest.spyOn(prismaService.groupMember, 'findUnique').mockResolvedValue(mockMembership);
      jest.spyOn(prismaService.group, 'findUnique').mockResolvedValue(mockGroup);

      const response = await request(app.getHttpServer())
        .get('/api/export?type=groups&groupId=group1')
        .expect(200);

      expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(response.headers['content-disposition']).toMatch(/attachment; filename="group_group1_/);
      expect(response.text).toContain('GROUP INFORMATION');
      expect(response.text).toContain('Test Group');
      expect(response.text).toContain('ABC123');
    });

    it('should return 400 for invalid export type', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/export?type=invalid')
        .expect(400);

      expect(response.body.message).toContain('Invalid export type');
    });

    it('should return 400 when groupId is missing for group export', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/export?type=groups')
        .expect(400);

      expect(response.body.message).toContain('Group ID is required');
    });

    it('should return 403 when user is not a group member', async () => {
      jest.spyOn(prismaService.groupMember, 'findUnique').mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .get('/api/export?type=groups&groupId=group1')
        .expect(403);

      expect(response.body.message).toContain('You are not a member of this group');
    });
  });

  describe('GET /api/export/transactions', () => {
    it('should export transactions with date filtering', async () => {
      const mockTransactions = [];
      jest.spyOn(prismaService.transaction, 'findMany').mockResolvedValue(mockTransactions);

      await request(app.getHttpServer())
        .get('/api/export/transactions?startDate=2024-01-01&endDate=2024-01-31')
        .expect(200);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'test-user-id',
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

    it('should export transactions with category filtering', async () => {
      const mockTransactions = [];
      jest.spyOn(prismaService.transaction, 'findMany').mockResolvedValue(mockTransactions);

      await request(app.getHttpServer())
        .get('/api/export/transactions?category=Food')
        .expect(200);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'test-user-id',
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

  describe('GET /api/export/budgets', () => {
    it('should export budgets with category filtering', async () => {
      const mockBudgets = [];
      jest.spyOn(prismaService.budget, 'findMany').mockResolvedValue(mockBudgets);

      await request(app.getHttpServer())
        .get('/api/export/budgets?category=Food')
        .expect(200);

      expect(prismaService.budget.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'test-user-id',
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

  describe('GET /api/export/groups/:groupId', () => {
    it('should export specific group data', async () => {
      const mockMembership = {
        id: 'member1',
        userId: 'test-user-id',
        groupId: 'group1',
        role: GroupRole.MEMBER,
      };

      const mockGroup = {
        id: 'group1',
        name: 'Test Group',
        inviteCode: 'ABC123',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        members: [],
        sharedExpenses: [],
        groupBalances: [],
      };

      jest.spyOn(prismaService.groupMember, 'findUnique').mockResolvedValue(mockMembership);
      jest.spyOn(prismaService.group, 'findUnique').mockResolvedValue(mockGroup);

      const response = await request(app.getHttpServer())
        .get('/api/export/groups/group1')
        .expect(200);

      expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(response.text).toContain('GROUP INFORMATION');
    });
  });
});