import { Test, TestingModule } from '@nestjs/testing';
import { GroupsService } from './groups.service';
import { PrismaService } from '../../database/prisma.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { GroupRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

describe('GroupsService - Settlement Functionality', () => {
  let service: GroupsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    groupMember: {
      findFirst: jest.fn(),
    },
    groupBalance: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    settlement: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GroupsService>(GroupsService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('previewSettlement', () => {
    it('should calculate settlement preview correctly', async () => {
      const groupId = 'group1';
      const userId = 'admin1';
      const settlementPreviewDto = { userIds: ['user1', 'user2', 'user3'] };

      // Mock admin verification
      mockPrismaService.groupMember.findFirst.mockResolvedValue({
        id: 'member1',
        userId: 'admin1',
        groupId: 'group1',
        role: GroupRole.ADMIN,
      });

      // Mock getMembers method
      jest.spyOn(service, 'getMembers').mockResolvedValue([
        { id: 'member1', userId: 'user1', groupId: 'group1', role: GroupRole.MEMBER, user: { id: 'user1', name: 'User 1', email: 'user1@test.com' } },
        { id: 'member2', userId: 'user2', groupId: 'group1', role: GroupRole.MEMBER, user: { id: 'user2', name: 'User 2', email: 'user2@test.com' } },
        { id: 'member3', userId: 'user3', groupId: 'group1', role: GroupRole.MEMBER, user: { id: 'user3', name: 'User 3', email: 'user3@test.com' } },
      ] as any);

      // Mock balances
      mockPrismaService.groupBalance.findMany.mockResolvedValue([
        {
          id: 'balance1',
          userId: 'user1',
          groupId: 'group1',
          balance: new Decimal(60),
          user: { id: 'user1', name: 'User 1', email: 'user1@test.com' },
        },
        {
          id: 'balance2',
          userId: 'user2',
          groupId: 'group1',
          balance: new Decimal(30),
          user: { id: 'user2', name: 'User 2', email: 'user2@test.com' },
        },
        {
          id: 'balance3',
          userId: 'user3',
          groupId: 'group1',
          balance: new Decimal(0),
          user: { id: 'user3', name: 'User 3', email: 'user3@test.com' },
        },
      ]);

      const result = await service.previewSettlement(groupId, settlementPreviewDto, userId);

      expect(result.totalBalance).toEqual(new Decimal(90));
      expect(result.equalShare).toEqual(new Decimal(30));
      expect(result.participantCount).toBe(3);
      expect(result.settlementPreview).toHaveLength(3);
      
      // User 1 should owe 30 (has 60, should have 30)
      expect(result.settlementPreview[0].willOwe).toEqual(new Decimal(30));
      expect(result.settlementPreview[0].willReceive).toEqual(new Decimal(0));
      
      // User 2 should have no change (has 30, should have 30)
      expect(result.settlementPreview[1].willOwe).toEqual(new Decimal(0));
      expect(result.settlementPreview[1].willReceive).toEqual(new Decimal(0));
      
      // User 3 should receive 30 (has 0, should have 30)
      expect(result.settlementPreview[2].willOwe).toEqual(new Decimal(0));
      expect(result.settlementPreview[2].willReceive).toEqual(new Decimal(30));
    });

    it('should throw ForbiddenException for non-admin user', async () => {
      const groupId = 'group1';
      const userId = 'user1';
      const settlementPreviewDto = { userIds: ['user1', 'user2'] };

      mockPrismaService.groupMember.findFirst.mockResolvedValue(null);

      await expect(
        service.previewSettlement(groupId, settlementPreviewDto, userId)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should include all members when no userIds provided', async () => {
      const groupId = 'group1';
      const userId = 'admin1';
      const settlementPreviewDto = {};

      // Mock admin verification
      mockPrismaService.groupMember.findFirst.mockResolvedValue({
        id: 'member1',
        userId: 'admin1',
        groupId: 'group1',
        role: GroupRole.ADMIN,
      });

      // Mock getMembers method
      jest.spyOn(service, 'getMembers').mockResolvedValue([
        { id: 'member1', userId: 'user1', groupId: 'group1', role: GroupRole.MEMBER, user: { id: 'user1', name: 'User 1', email: 'user1@test.com' } },
        { id: 'member2', userId: 'user2', groupId: 'group1', role: GroupRole.MEMBER, user: { id: 'user2', name: 'User 2', email: 'user2@test.com' } },
      ] as any);

      // Mock balances
      mockPrismaService.groupBalance.findMany.mockResolvedValue([
        {
          id: 'balance1',
          userId: 'user1',
          groupId: 'group1',
          balance: new Decimal(50),
          user: { id: 'user1', name: 'User 1', email: 'user1@test.com' },
        },
        {
          id: 'balance2',
          userId: 'user2',
          groupId: 'group1',
          balance: new Decimal(30),
          user: { id: 'user2', name: 'User 2', email: 'user2@test.com' },
        },
      ]);

      const result = await service.previewSettlement(groupId, settlementPreviewDto, userId);

      expect(result.participantCount).toBe(2);
      expect(mockPrismaService.groupBalance.findMany).toHaveBeenCalledWith({
        where: {
          groupId: 'group1',
          userId: {
            in: ['user1', 'user2'],
          },
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

  describe('executeSettlement', () => {
    it('should execute settlement successfully', async () => {
      const groupId = 'group1';
      const userId = 'admin1';
      const settlementConfirmationDto = {
        confirmed: true,
        userIds: ['user1', 'user2', 'user3'],
      };

      // Mock admin verification
      mockPrismaService.groupMember.findFirst.mockResolvedValue({
        id: 'member1',
        userId: 'admin1',
        groupId: 'group1',
        role: GroupRole.ADMIN,
      });

      // Mock getMembers method
      jest.spyOn(service, 'getMembers').mockResolvedValue([
        { id: 'member1', userId: 'user1', groupId: 'group1', role: GroupRole.MEMBER, user: { id: 'user1', name: 'User 1', email: 'user1@test.com' } },
        { id: 'member2', userId: 'user2', groupId: 'group1', role: GroupRole.MEMBER, user: { id: 'user2', name: 'User 2', email: 'user2@test.com' } },
        { id: 'member3', userId: 'user3', groupId: 'group1', role: GroupRole.MEMBER, user: { id: 'user3', name: 'User 3', email: 'user3@test.com' } },
      ] as any);

      // Mock balances
      const mockBalances = [
        {
          id: 'balance1',
          userId: 'user1',
          groupId: 'group1',
          balance: new Decimal(60),
          user: { id: 'user1', name: 'User 1', email: 'user1@test.com' },
        },
        {
          id: 'balance2',
          userId: 'user2',
          groupId: 'group1',
          balance: new Decimal(30),
          user: { id: 'user2', name: 'User 2', email: 'user2@test.com' },
        },
        {
          id: 'balance3',
          userId: 'user3',
          groupId: 'group1',
          balance: new Decimal(0),
          user: { id: 'user3', name: 'User 3', email: 'user3@test.com' },
        },
      ];

      mockPrismaService.groupBalance.findMany.mockResolvedValue(mockBalances);

      // Mock transaction
      const mockSettlements = [
        {
          id: 'settlement1',
          fromId: 'user1',
          toId: 'user3',
          amount: new Decimal(30),
          groupId: 'group1',
          createdAt: new Date(),
          from: { id: 'user1', name: 'User 1', email: 'user1@test.com' },
        },
      ];

      const mockUpdatedBalances = mockBalances.map(balance => ({
        ...balance,
        balance: new Decimal(30),
      }));

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          groupBalance: {
            update: jest.fn().mockResolvedValue(mockUpdatedBalances[0]),
          },
          settlement: {
            create: jest.fn().mockResolvedValue(mockSettlements[0]),
          },
        });
      });

      const result = await service.executeSettlement(groupId, settlementConfirmationDto, userId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Settlement executed successfully');
      expect(result.data.summary.participantCount).toBe(3);
      expect(result.data.summary.equalShare).toEqual(new Decimal(30));
    });

    it('should throw BadRequestException when not confirmed', async () => {
      const groupId = 'group1';
      const userId = 'admin1';
      const settlementConfirmationDto = {
        confirmed: false,
        userIds: ['user1', 'user2'],
      };

      await expect(
        service.executeSettlement(groupId, settlementConfirmationDto, userId)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException for non-admin user', async () => {
      const groupId = 'group1';
      const userId = 'user1';
      const settlementConfirmationDto = {
        confirmed: true,
        userIds: ['user1', 'user2'],
      };

      mockPrismaService.groupMember.findFirst.mockResolvedValue(null);

      await expect(
        service.executeSettlement(groupId, settlementConfirmationDto, userId)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for invalid user ID', async () => {
      const groupId = 'group1';
      const userId = 'admin1';
      const settlementConfirmationDto = {
        confirmed: true,
        userIds: ['user1', 'invalid_user'],
      };

      // Mock admin verification
      mockPrismaService.groupMember.findFirst.mockResolvedValue({
        id: 'member1',
        userId: 'admin1',
        groupId: 'group1',
        role: GroupRole.ADMIN,
      });

      // Mock getMembers method
      jest.spyOn(service, 'getMembers').mockResolvedValue([
        { id: 'member1', userId: 'user1', groupId: 'group1', role: GroupRole.MEMBER, user: { id: 'user1', name: 'User 1', email: 'user1@test.com' } },
      ] as any);

      await expect(
        service.executeSettlement(groupId, settlementConfirmationDto, userId)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('splitEqually (backward compatibility)', () => {
    it('should redirect to executeSettlement', async () => {
      const groupId = 'group1';
      const userId = 'admin1';
      const splitEquallyDto = { userIds: ['user1', 'user2'] };

      // Mock executeSettlement
      const mockExecuteResult = {
        success: true,
        message: 'Settlement executed successfully',
        data: {
          settlements: [
            {
              id: 'settlement1',
              fromId: 'user1',
              toId: 'user2',
              amount: new Decimal(10),
              groupId: 'group1',
              createdAt: new Date(),
              from: { id: 'user1', name: 'User 1', email: 'user1@test.com' },
            },
          ],
          updatedBalances: [
            {
              id: 'balance1',
              userId: 'user1',
              groupId: 'group1',
              balance: new Decimal(25),
              user: { id: 'user1', name: 'User 1', email: 'user1@test.com' },
            },
          ],
          summary: {
            totalBalance: new Decimal(50),
            equalShare: new Decimal(25),
            participantCount: 2,
            settlementsCreated: 1,
          },
        },
      };

      jest.spyOn(service, 'executeSettlement').mockResolvedValue(mockExecuteResult);

      const result = await service.splitEqually(groupId, splitEquallyDto, userId);

      expect(service.executeSettlement).toHaveBeenCalledWith(
        groupId,
        { confirmed: true, userIds: splitEquallyDto.userIds },
        userId
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Settlement executed successfully');
      expect(result.settlements).toEqual(mockExecuteResult.data.settlements);
      expect(result.equalShare).toEqual(new Decimal(25));
    });
  });
});