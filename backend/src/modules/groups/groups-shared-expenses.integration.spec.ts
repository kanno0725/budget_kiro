import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../database/prisma.service';
import { SplitType } from './dto/create-shared-expense.dto';

describe('Groups Shared Expenses (Integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let authToken1: string;
  let authToken2: string;
  let testUser1Id: string;
  let testUser2Id: string;
  let testGroupId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();

    // Create test users
    const testUser1 = await prismaService.user.create({
      data: {
        email: 'user1@test.com',
        password: 'hashedpassword1',
        name: 'Test User 1',
      },
    });
    testUser1Id = testUser1.id;

    const testUser2 = await prismaService.user.create({
      data: {
        email: 'user2@test.com',
        password: 'hashedpassword2',
        name: 'Test User 2',
      },
    });
    testUser2Id = testUser2.id;

    // Generate auth tokens
    authToken1 = jwtService.sign({ sub: testUser1Id, email: testUser1.email });
    authToken2 = jwtService.sign({ sub: testUser2Id, email: testUser2.email });

    // Create test group
    const testGroup = await prismaService.group.create({
      data: {
        name: 'Test Family Budget',
        inviteCode: 'testinvite123',
        members: {
          createMany: {
            data: [
              { userId: testUser1Id, role: 'ADMIN' },
              { userId: testUser2Id, role: 'MEMBER' }
            ]
          }
        }
      }
    });
    testGroupId = testGroup.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prismaService.expenseSplit.deleteMany({});
    await prismaService.sharedExpense.deleteMany({});
    await prismaService.groupBalance.deleteMany({});
    await prismaService.settlement.deleteMany({});
    await prismaService.groupMember.deleteMany({});
    await prismaService.group.deleteMany({});
    await prismaService.user.deleteMany({
      where: {
        id: { in: [testUser1Id, testUser2Id] }
      }
    });

    await app.close();
  });

  describe('POST /groups/:id/expenses', () => {
    it('should create shared expense with equal split', async () => {
      const createExpenseDto = {
        amount: 100.00,
        description: 'Dinner at restaurant',
        date: '2024-01-15T19:30:00.000Z',
        splitType: SplitType.EQUAL,
        splits: [
          { userId: testUser1Id },
          { userId: testUser2Id }
        ]
      };

      const response = await request(app.getHttpServer())
        .post(`/groups/${testGroupId}/expenses`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(createExpenseDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe('100');
      expect(response.body.data.description).toBe('Dinner at restaurant');
      expect(response.body.data.payerId).toBe(testUser1Id);
      expect(response.body.data.splits).toHaveLength(2);
    });

    it('should create shared expense with custom split', async () => {
      const createExpenseDto = {
        amount: 100.00,
        description: 'Groceries',
        date: '2024-01-16T10:00:00.000Z',
        splitType: SplitType.CUSTOM,
        splits: [
          { userId: testUser1Id, amount: 60.00 },
          { userId: testUser2Id, amount: 40.00 }
        ]
      };

      const response = await request(app.getHttpServer())
        .post(`/groups/${testGroupId}/expenses`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send(createExpenseDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe('100');
      expect(response.body.data.payerId).toBe(testUser2Id);
    });

    it('should return 400 for invalid custom split amounts', async () => {
      const createExpenseDto = {
        amount: 100.00,
        description: 'Invalid split',
        date: '2024-01-17T10:00:00.000Z',
        splitType: SplitType.CUSTOM,
        splits: [
          { userId: testUser1Id, amount: 60.00 },
          { userId: testUser2Id, amount: 30.00 } // Total is 90, not 100
        ]
      };

      await request(app.getHttpServer())
        .post(`/groups/${testGroupId}/expenses`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(createExpenseDto)
        .expect(400);
    });

    it('should return 400 for non-member in splits', async () => {
      const nonMemberUser = await prismaService.user.create({
        data: {
          email: 'nonmember@test.com',
          password: 'hashedpassword',
          name: 'Non Member'
        }
      });

      const createExpenseDto = {
        amount: 100.00,
        description: 'Invalid member',
        date: '2024-01-18T10:00:00.000Z',
        splitType: SplitType.EQUAL,
        splits: [
          { userId: testUser1Id },
          { userId: nonMemberUser.id } // Non-member
        ]
      };

      await request(app.getHttpServer())
        .post(`/groups/${testGroupId}/expenses`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(createExpenseDto)
        .expect(400);

      // Clean up
      await prismaService.user.delete({ where: { id: nonMemberUser.id } });
    });
  });

  describe('GET /groups/:id/expenses', () => {
    it('should return all shared expenses for group', async () => {
      const response = await request(app.getHttpServer())
        .get(`/groups/${testGroupId}/expenses`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /groups/:id/balances', () => {
    it('should return group balances', async () => {
      const response = await request(app.getHttpServer())
        .get(`/groups/${testGroupId}/balances`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(2);
      
      // Check that balances exist for both users
      const userIds = response.body.data.map((balance: any) => balance.userId);
      expect(userIds).toContain(testUser1Id);
      expect(userIds).toContain(testUser2Id);
    });
  });

  describe('POST /groups/:id/split-equally', () => {
    it('should perform equal split settlement (admin only)', async () => {
      const splitEquallyDto = {
        userIds: [testUser1Id, testUser2Id]
      };

      const response = await request(app.getHttpServer())
        .post(`/groups/${testGroupId}/split-equally`)
        .set('Authorization', `Bearer ${authToken1}`) // Admin user
        .send(splitEquallyDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Equal split settlement completed successfully');
    });

    it('should return 403 for non-admin user', async () => {
      const splitEquallyDto = {
        userIds: [testUser1Id, testUser2Id]
      };

      await request(app.getHttpServer())
        .post(`/groups/${testGroupId}/split-equally`)
        .set('Authorization', `Bearer ${authToken2}`) // Non-admin user
        .send(splitEquallyDto)
        .expect(403);
    });
  });

  describe('GET /groups/:id/settlements', () => {
    it('should return settlement history', async () => {
      const response = await request(app.getHttpServer())
        .get(`/groups/${testGroupId}/settlements`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });
});