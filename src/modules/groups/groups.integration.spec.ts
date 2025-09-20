import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { GroupRole } from '@prisma/client';

describe('Groups (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  let testUser1: any;
  let testUser2: any;
  let testGroup: any;
  let authToken1: string;
  let authToken2: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();

    // Clean up database
    await prismaService.groupMember.deleteMany();
    await prismaService.group.deleteMany();
    await prismaService.user.deleteMany();

    // Create test users
    testUser1 = await prismaService.user.create({
      data: {
        email: 'user1@test.com',
        password: 'hashedpassword1',
        name: 'Test User 1'
      }
    });

    testUser2 = await prismaService.user.create({
      data: {
        email: 'user2@test.com',
        password: 'hashedpassword2',
        name: 'Test User 2'
      }
    });

    // Generate JWT tokens
    authToken1 = jwtService.sign({ sub: testUser1.id, email: testUser1.email });
    authToken2 = jwtService.sign({ sub: testUser2.id, email: testUser2.email });
  });

  afterAll(async () => {
    // Clean up
    await prismaService.groupMember.deleteMany();
    await prismaService.group.deleteMany();
    await prismaService.user.deleteMany();
    await app.close();
  });

  describe('POST /groups', () => {
    it('should create a new group', async () => {
      const createGroupDto = {
        name: 'Test Family Budget'
      };

      const response = await request(app.getHttpServer())
        .post('/groups')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(createGroupDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(createGroupDto.name);
      expect(response.body.data.inviteCode).toBeDefined();
      expect(response.body.data.members).toHaveLength(1);
      expect(response.body.data.members[0].role).toBe(GroupRole.ADMIN);
      expect(response.body.data.members[0].user.id).toBe(testUser1.id);

      testGroup = response.body.data;
    });

    it('should require authentication', async () => {
      const createGroupDto = {
        name: 'Test Group'
      };

      await request(app.getHttpServer())
        .post('/groups')
        .send(createGroupDto)
        .expect(401);
    });

    it('should validate group name', async () => {
      const createGroupDto = {
        name: ''
      };

      await request(app.getHttpServer())
        .post('/groups')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(createGroupDto)
        .expect(400);
    });
  });

  describe('GET /groups', () => {
    it('should return user groups', async () => {
      const response = await request(app.getHttpServer())
        .get('/groups')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(testGroup.id);
    });

    it('should return empty array for user with no groups', async () => {
      const response = await request(app.getHttpServer())
        .get('/groups')
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /groups/:id', () => {
    it('should return group details for member', async () => {
      const response = await request(app.getHttpServer())
        .get(`/groups/${testGroup.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testGroup.id);
    });

    it('should return 404 for non-member', async () => {
      await request(app.getHttpServer())
        .get(`/groups/${testGroup.id}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(404);
    });
  });

  describe('POST /groups/join', () => {
    it('should allow user to join group with valid invite code', async () => {
      const joinGroupDto = {
        inviteCode: testGroup.inviteCode
      };

      const response = await request(app.getHttpServer())
        .post('/groups/join')
        .set('Authorization', `Bearer ${authToken2}`)
        .send(joinGroupDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Successfully joined group');
    });

    it('should return 404 for invalid invite code', async () => {
      const joinGroupDto = {
        inviteCode: 'invalidcode'
      };

      await request(app.getHttpServer())
        .post('/groups/join')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(joinGroupDto)
        .expect(404);
    });

    it('should return 409 if user is already a member', async () => {
      const joinGroupDto = {
        inviteCode: testGroup.inviteCode
      };

      await request(app.getHttpServer())
        .post('/groups/join')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(joinGroupDto)
        .expect(409);
    });
  });

  describe('GET /groups/:id/members', () => {
    it('should return group members', async () => {
      const response = await request(app.getHttpServer())
        .get(`/groups/${testGroup.id}/members`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      
      // Admin should be first
      expect(response.body.data[0].role).toBe(GroupRole.ADMIN);
      expect(response.body.data[1].role).toBe(GroupRole.MEMBER);
    });
  });

  describe('PUT /groups/:id/members/:memberId/role', () => {
    let memberToPromote: any;

    beforeAll(async () => {
      // Get the member to promote
      const members = await prismaService.groupMember.findMany({
        where: { groupId: testGroup.id, role: GroupRole.MEMBER }
      });
      memberToPromote = members[0];
    });

    it('should allow admin to update member role', async () => {
      const updateRoleDto = {
        role: GroupRole.ADMIN
      };

      const response = await request(app.getHttpServer())
        .put(`/groups/${testGroup.id}/members/${memberToPromote.id}/role`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(updateRoleDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe(GroupRole.ADMIN);
    });

    it('should not allow non-admin to update member role', async () => {
      const updateRoleDto = {
        role: GroupRole.MEMBER
      };

      await request(app.getHttpServer())
        .put(`/groups/${testGroup.id}/members/${memberToPromote.id}/role`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send(updateRoleDto)
        .expect(403);
    });
  });

  describe('POST /groups/:id/regenerate-invite', () => {
    it('should allow admin to regenerate invite code', async () => {
      const response = await request(app.getHttpServer())
        .post(`/groups/${testGroup.id}/regenerate-invite`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.inviteCode).toBeDefined();
      expect(response.body.data.inviteCode).not.toBe(testGroup.inviteCode);
    });

    it('should not allow non-admin to regenerate invite code', async () => {
      await request(app.getHttpServer())
        .post(`/groups/${testGroup.id}/regenerate-invite`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(403);
    });
  });

  describe('POST /groups/:id/leave', () => {
    it('should allow member to leave group', async () => {
      const response = await request(app.getHttpServer())
        .post(`/groups/${testGroup.id}/leave`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Left group successfully');
    });

    it('should not allow only admin to leave group', async () => {
      await request(app.getHttpServer())
        .post(`/groups/${testGroup.id}/leave`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(403);
    });
  });
});