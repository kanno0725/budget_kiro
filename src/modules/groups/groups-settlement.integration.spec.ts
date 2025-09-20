import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { GroupRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

describe('Groups Settlement (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  let testUser1Id: string;
  let testUser2Id: string;
  let testUser3Id: string;
  let testGroupId: string;
  let authToken1: string; // Admin token
  let authToken2: string; // Member token

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();

    // Clean up any existing test data
    await prismaService.settlement.deleteMany({});
    await prismaService.groupBalance.deleteMany({});
    await prismaService.expenseSplit.deleteMany({});
    await prismaService.sharedExpense.deleteMany({});
    await prismaService.groupMember.deleteMany({});
    await prismaService.group.deleteMany({});
    await prismaService.user.deleteMany({});

    // Create test users
    const user1 = await prismaService.user.create({
      data: {
        email: 'settlement-admin@test.com',
        password: 'hashedpassword',
        name: 'Settlement Admin',
      },
    });
    testUser1Id = user1.id;

    const user2 = await prismaService.user.create({
      data: {
        email: 'settlement-member@test.com',
        password: 'hashedpassword',
        name: 'Settlement Member',
      },
    });
    testUser2Id = user2.id;

    const user3 = await prismaService.user.create({
      data: {
        email: 'settlement-member2@test.com',
        password: 'hashedpassword',
        name: 'Settlement Member 2',
      },
    });
    testUser3Id = user3.id;

    // Create test group
    const group = await prismaService.group.create({
      data: {
        name: 'Settlement Test Group',
        inviteCode: 'settlement123',
        members: {
          create: [
            {
              userId: testUser1Id,
              role: GroupRole.ADMIN,
            },
            {
              userId: testUser2Id,
              role: GroupRole.MEMBER,
            },
            {
              userId: testUser3Id,
              role: GroupRole.MEMBER,
            },
          ],
        },
      },
    });
    testGroupId = group.id;

    // Create test balances with different amounts
    await prismaService.groupBalance.createMany({
      data: [
        {
          userId: testUser1Id,
          groupId: testGroupId,
          balance: new Decimal(60), // User 1 has excess
        },
        {
          userId: testUser2Id,
          groupId: testGroupId,
          balance: new Decimal(30), // User 2 is balanced
        },
        {
          userId: testUser3Id,
          groupId: testGroupId,
          balance: new Decimal(0), // User 3 owes money
        },
      ],
    });

    // Generate JWT tokens
    authToken1 = jwtService.sign({ sub: testUser1Id, email: user1.email });
    authToken2 = jwtService.sign({ sub: testUser2Id, email: user2.email });
  });

  afterAll(async () => {
    // Clean up test data
    await prismaService.settlement.deleteMany({});
    await prismaService.groupBalance.deleteMany({});
    await prismaService.expenseSplit.deleteMany({});
    await prismaService.sharedExpense.deleteMany({});
    await prismaService.groupMember.deleteMany({});
    await prismaService.group.deleteMany({});
    await prismaService.user.deleteMany({});

    await app.close();
  });

  describe('POST /groups/:id/settlement-preview', () => {
    it('should calculate settlement preview correctly', async () => {
      const settlementPreviewDto = {
        userIds: [testUser1Id, testUser2Id, testUser3Id],
      };

      const response = await request(app.getHttpServer())
        .post(`/groups/${testGroupId}/settlement-preview`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(settlementPreviewDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalBalance).toBe(90);
      expect(response.body.data.equalShare).toBe(30);
      expect(response.body.data.participantCount).toBe(3);
      expect(response.body.data.settlementPreview).toHaveLength(3);

      // Check individual user calculations
      const user1Preview = response.body.data.settlementPreview.find(
        (p: any) => p.user.id === testUser1Id
      );
      expect(user1Preview.currentBalance).toBe(60);
      expect(user1Preview.targetBalance).toBe(30);
      expect(user1Preview.willOwe).toBe(30);
      expect(user1Preview.willReceive).toBe(0);

      const user3Preview = response.body.data.settlementPreview.find(
        (p: any) => p.user.id === testUser3Id
      );
      expect(user3Preview.currentBalance).toBe(0);
      expect(user3Preview.targetBalance).toBe(30);
      expect(user3Preview.willOwe).toBe(0);
      expect(user3Preview.willReceive).toBe(30);
    });

    it('should include all members when no userIds provided', async () => {
      const response = await request(app.getHttpServer())
        .post(`/groups/${testGroupId}/settlement-preview`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.participantCount).toBe(3);
    });

    it('should return 403 for non-admin user', async () => {
      const settlementPreviewDto = {
        userIds: [testUser1Id, testUser2Id],
      };

      await request(app.getHttpServer())
        .post(`/groups/${testGroupId}/settlement-preview`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send(settlementPreviewDto)
        .expect(403);
    });

    it('should return 400 for invalid user ID', async () => {
      const settlementPreviewDto = {
        userIds: [testUser1Id, 'invalid-user-id'],
      };

      await request(app.getHttpServer())
        .post(`/groups/${testGroupId}/settlement-preview`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(settlementPreviewDto)
        .expect(400);
    });
  });

  describe('POST /groups/:id/execute-settlement', () => {
    it('should execute settlement successfully', async () => {
      const settlementConfirmationDto = {
        confirmed: true,
        userIds: [testUser1Id, testUser2Id, testUser3Id],
      };

      const response = await request(app.getHttpServer())
        .post(`/groups/${testGroupId}/execute-settlement`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(settlementConfirmationDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Settlement executed successfully');
      expect(response.body.data.summary.participantCount).toBe(3);
      expect(response.body.data.summary.equalShare).toBe(30);
      expect(response.body.data.settlements.length).toBeGreaterThan(0);

      // Verify balances were updated
      const updatedBalances = await prismaService.groupBalance.findMany({
        where: { groupId: testGroupId },
        orderBy: { userId: 'asc' },
      });

      updatedBalances.forEach((balance) => {
        expect(balance.balance).toEqual(new Decimal(30));
      });

      // Verify settlement records were created
      const settlements = await prismaService.settlement.findMany({
        where: { groupId: testGroupId },
      });

      expect(settlements.length).toBeGreaterThan(0);
    });

    it('should return 400 when not confirmed', async () => {
      const settlementConfirmationDto = {
        confirmed: false,
        userIds: [testUser1Id, testUser2Id],
      };

      await request(app.getHttpServer())
        .post(`/groups/${testGroupId}/execute-settlement`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(settlementConfirmationDto)
        .expect(400);
    });

    it('should return 403 for non-admin user', async () => {
      const settlementConfirmationDto = {
        confirmed: true,
        userIds: [testUser1Id, testUser2Id],
      };

      await request(app.getHttpServer())
        .post(`/groups/${testGroupId}/execute-settlement`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send(settlementConfirmationDto)
        .expect(403);
    });
  });

  describe('POST /groups/:id/split-equally (backward compatibility)', () => {
    beforeEach(async () => {
      // Reset balances for each test
      await prismaService.groupBalance.updateMany({
        where: { groupId: testGroupId, userId: testUser1Id },
        data: { balance: new Decimal(60) },
      });
      await prismaService.groupBalance.updateMany({
        where: { groupId: testGroupId, userId: testUser2Id },
        data: { balance: new Decimal(30) },
      });
      await prismaService.groupBalance.updateMany({
        where: { groupId: testGroupId, userId: testUser3Id },
        data: { balance: new Decimal(0) },
      });

      // Clear previous settlements
      await prismaService.settlement.deleteMany({
        where: { groupId: testGroupId },
      });
    });

    it('should still work with old API format', async () => {
      const splitEquallyDto = {
        userIds: [testUser1Id, testUser2Id, testUser3Id],
      };

      const response = await request(app.getHttpServer())
        .post(`/groups/${testGroupId}/split-equally`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(splitEquallyDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Settlement executed successfully');
      expect(response.body.equalShare).toBe(30);
      expect(response.body.settlements).toBeDefined();

      // Verify balances were updated
      const updatedBalances = await prismaService.groupBalance.findMany({
        where: { groupId: testGroupId },
        orderBy: { userId: 'asc' },
      });

      updatedBalances.forEach((balance) => {
        expect(balance.balance).toEqual(new Decimal(30));
      });
    });
  });

  describe('GET /groups/:id/settlements', () => {
    it('should return settlement history', async () => {
      const response = await request(app.getHttpServer())
        .get(`/groups/${testGroupId}/settlements`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        const settlement = response.body.data[0];
        expect(settlement).toHaveProperty('id');
        expect(settlement).toHaveProperty('fromId');
        expect(settlement).toHaveProperty('toId');
        expect(settlement).toHaveProperty('amount');
        expect(settlement).toHaveProperty('groupId');
        expect(settlement).toHaveProperty('createdAt');
        expect(settlement).toHaveProperty('from');
      }
    });
  });
});