import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../database/prisma.service';
import { BudgetsModule } from './budgets.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TransactionType } from '@prisma/client';

describe('BudgetsController (Integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const testUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedpassword',
  };

  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
        BudgetsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Generate auth token
    authToken = jwtService.sign({ sub: testUser.id, email: testUser.email });

    await app.init();
  });

  beforeEach(async () => {
    // Clean up database
    await prismaService.budget.deleteMany();
    await prismaService.transaction.deleteMany();
    await prismaService.user.deleteMany();

    // Create test user
    await prismaService.user.create({
      data: testUser,
    });
  });

  afterAll(async () => {
    await prismaService.budget.deleteMany();
    await prismaService.transaction.deleteMany();
    await prismaService.user.deleteMany();
    await app.close();
  });

  describe('POST /budgets', () => {
    it('should create a budget successfully', async () => {
      const createBudgetDto = {
        category: '食費',
        amount: 50000,
        month: 1,
        year: 2024,
      };

      const response = await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createBudgetDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        category: '食費',
        amount: 50000,
        month: 1,
        year: 2024,
        userId: testUser.id,
      });
    });

    it('should return 409 if budget already exists', async () => {
      const createBudgetDto = {
        category: '食費',
        amount: 50000,
        month: 1,
        year: 2024,
      };

      // Create first budget
      await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createBudgetDto)
        .expect(201);

      // Try to create duplicate
      await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createBudgetDto)
        .expect(409);
    });

    it('should return 400 for invalid data', async () => {
      const invalidDto = {
        category: '',
        amount: -1000,
        month: 13,
        year: 1999,
      };

      await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('GET /budgets', () => {
    beforeEach(async () => {
      // Create test budgets
      await prismaService.budget.createMany({
        data: [
          {
            category: '食費',
            amount: 50000,
            month: 1,
            year: 2024,
            userId: testUser.id,
          },
          {
            category: '交通費',
            amount: 30000,
            month: 1,
            year: 2024,
            userId: testUser.id,
          },
        ],
      });
    });

    it('should return all budgets for user', async () => {
      const response = await request(app.getHttpServer())
        .get('/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter budgets by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/budgets?category=食費')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe('食費');
    });
  });

  describe('GET /budgets/alerts', () => {
    beforeEach(async () => {
      // Create budget
      await prismaService.budget.create({
        data: {
          category: '食費',
          amount: 50000,
          month: 1,
          year: 2024,
          userId: testUser.id,
        },
      });

      // Create transactions that exceed 80% of budget
      await prismaService.transaction.create({
        data: {
          amount: 45000, // 90% of budget
          category: '食費',
          description: 'Test expense',
          date: new Date('2024-01-15'),
          type: TransactionType.EXPENSE,
          userId: testUser.id,
        },
      });
    });

    it('should return budget alerts', async () => {
      const response = await request(app.getHttpServer())
        .get('/budgets/alerts?month=1&year=2024')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        category: '食費',
        budgetAmount: 50000,
        actualAmount: 45000,
        alertType: 'warning',
      });
    });
  });

  describe('GET /budgets/report', () => {
    beforeEach(async () => {
      // Create budget
      await prismaService.budget.create({
        data: {
          category: '食費',
          amount: 50000,
          month: 1,
          year: 2024,
          userId: testUser.id,
        },
      });

      // Create transaction
      await prismaService.transaction.create({
        data: {
          amount: 30000,
          category: '食費',
          description: 'Test expense',
          date: new Date('2024-01-15'),
          type: TransactionType.EXPENSE,
          userId: testUser.id,
        },
      });
    });

    it('should return budget vs actual report', async () => {
      const response = await request(app.getHttpServer())
        .get('/budgets/report?month=1&year=2024')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        category: '食費',
        budgetAmount: 50000,
        actualAmount: 30000,
        remaining: 20000,
        percentage: 60,
        status: 'under_budget',
      });
    });
  });

  describe('GET /budgets/summary', () => {
    beforeEach(async () => {
      // Create budgets
      await prismaService.budget.createMany({
        data: [
          {
            category: '食費',
            amount: 50000,
            month: 1,
            year: 2024,
            userId: testUser.id,
          },
          {
            category: '交通費',
            amount: 30000,
            month: 1,
            year: 2024,
            userId: testUser.id,
          },
        ],
      });

      // Create transactions
      await prismaService.transaction.createMany({
        data: [
          {
            amount: 30000,
            category: '食費',
            description: 'Food expense',
            date: new Date('2024-01-15'),
            type: TransactionType.EXPENSE,
            userId: testUser.id,
          },
          {
            amount: 20000,
            category: '交通費',
            description: 'Transport expense',
            date: new Date('2024-01-15'),
            type: TransactionType.EXPENSE,
            userId: testUser.id,
          },
        ],
      });
    });

    it('should return budget summary', async () => {
      const response = await request(app.getHttpServer())
        .get('/budgets/summary?month=1&year=2024')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        month: 1,
        year: 2024,
        totalBudget: 80000,
        totalActual: 50000,
        totalRemaining: 30000,
        totalPercentage: 62.5,
        budgetCount: 2,
      });
    });
  });

  describe('PATCH /budgets/:id', () => {
    let budgetId: string;

    beforeEach(async () => {
      const budget = await prismaService.budget.create({
        data: {
          category: '食費',
          amount: 50000,
          month: 1,
          year: 2024,
          userId: testUser.id,
        },
      });
      budgetId = budget.id;
    });

    it('should update a budget successfully', async () => {
      const updateDto = {
        amount: 60000,
      };

      const response = await request(app.getHttpServer())
        .patch(`/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(60000);
    });

    it('should return 404 for non-existent budget', async () => {
      await request(app.getHttpServer())
        .patch('/budgets/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 60000 })
        .expect(404);
    });
  });

  describe('DELETE /budgets/:id', () => {
    let budgetId: string;

    beforeEach(async () => {
      const budget = await prismaService.budget.create({
        data: {
          category: '食費',
          amount: 50000,
          month: 1,
          year: 2024,
          userId: testUser.id,
        },
      });
      budgetId = budget.id;
    });

    it('should delete a budget successfully', async () => {
      await request(app.getHttpServer())
        .delete(`/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify budget is deleted
      const budget = await prismaService.budget.findUnique({
        where: { id: budgetId },
      });
      expect(budget).toBeNull();
    });

    it('should return 404 for non-existent budget', async () => {
      await request(app.getHttpServer())
        .delete('/budgets/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});