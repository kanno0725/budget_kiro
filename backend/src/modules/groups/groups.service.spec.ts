import { Test, TestingModule } from "@nestjs/testing";
import { GroupsService } from "./groups.service";
import { PrismaService } from "../../database/prisma.service";
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { GroupRole } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { SplitType } from "./dto/create-shared-expense.dto";

describe("GroupsService", () => {
  let service: GroupsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    group: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    groupMember: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    sharedExpense: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    expenseSplit: {
      createMany: jest.fn(),
    },
    groupBalance: {
      findMany: jest.fn(),
      createMany: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    settlement: {
      findMany: jest.fn(),
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a group with the creator as admin", async () => {
      const createGroupDto = { name: "Test Group" };
      const userId = "user1";
      const mockGroup = {
        id: "group1",
        name: "Test Group",
        inviteCode: "abc123def456",
        createdAt: new Date(),
        updatedAt: new Date(),
        members: [
          {
            id: "member1",
            userId: "user1",
            groupId: "group1",
            role: GroupRole.ADMIN,
            user: {
              id: "user1",
              name: "John Doe",
              email: "john@example.com",
            },
          },
        ],
      };

      mockPrismaService.group.create.mockResolvedValue(mockGroup);

      const result = await service.create(createGroupDto, userId);

      expect(mockPrismaService.group.create).toHaveBeenCalledWith({
        data: {
          name: createGroupDto.name,
          inviteCode: expect.any(String),
          members: {
            create: {
              userId,
              role: GroupRole.ADMIN,
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });
      expect(result).toEqual(mockGroup);
    });
  });

  describe("findAll", () => {
    it("should return all groups for a user", async () => {
      const userId = "user1";
      const mockGroups = [
        {
          id: "group1",
          name: "Test Group",
          inviteCode: "abc123",
          createdAt: new Date(),
          updatedAt: new Date(),
          members: [],
          _count: { members: 2, sharedExpenses: 3 },
        },
      ];

      mockPrismaService.group.findMany.mockResolvedValue(mockGroups);

      const result = await service.findAll(userId);

      expect(mockPrismaService.group.findMany).toHaveBeenCalledWith({
        where: {
          members: {
            some: {
              userId,
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
              sharedExpenses: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      expect(result).toEqual(mockGroups);
    });
  });

  describe("findOne", () => {
    it("should return a group if user has access", async () => {
      const groupId = "group1";
      const userId = "user1";
      const mockGroup = {
        id: "group1",
        name: "Test Group",
        inviteCode: "abc123",
        members: [],
        _count: { members: 2, sharedExpenses: 3 },
      };

      mockPrismaService.group.findFirst.mockResolvedValue(mockGroup);

      const result = await service.findOne(groupId, userId);

      expect(result).toEqual(mockGroup);
    });

    it("should throw NotFoundException if group not found or no access", async () => {
      const groupId = "group1";
      const userId = "user1";

      mockPrismaService.group.findFirst.mockResolvedValue(null);

      await expect(service.findOne(groupId, userId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("joinGroup", () => {
    it("should add user to group successfully", async () => {
      const joinGroupDto = { inviteCode: "abc123" };
      const userId = "user2";
      const mockGroup = {
        id: "group1",
        name: "Test Group",
        inviteCode: "abc123",
        members: [
          {
            id: "member1",
            userId: "user1",
            groupId: "group1",
            role: GroupRole.ADMIN,
          },
        ],
      };

      mockPrismaService.group.findUnique.mockResolvedValue(mockGroup);
      mockPrismaService.groupMember.create.mockResolvedValue({});

      // Mock findOne for return value
      const mockUpdatedGroup = {
        ...mockGroup,
        members: [...mockGroup.members, { userId: "user2" }],
      };
      jest.spyOn(service, "findOne").mockResolvedValue(mockUpdatedGroup as any);

      const result = await service.joinGroup(joinGroupDto, userId);

      expect(mockPrismaService.groupMember.create).toHaveBeenCalledWith({
        data: {
          userId,
          groupId: mockGroup.id,
          role: GroupRole.MEMBER,
        },
      });
      expect(result).toEqual(mockUpdatedGroup);
    });

    it("should throw NotFoundException for invalid invite code", async () => {
      const joinGroupDto = { inviteCode: "invalid" };
      const userId = "user2";

      mockPrismaService.group.findUnique.mockResolvedValue(null);

      await expect(service.joinGroup(joinGroupDto, userId)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw ConflictException if user is already a member", async () => {
      const joinGroupDto = { inviteCode: "abc123" };
      const userId = "user1";
      const mockGroup = {
        id: "group1",
        members: [
          {
            id: "member1",
            userId: "user1",
            groupId: "group1",
            role: GroupRole.ADMIN,
          },
        ],
      };

      mockPrismaService.group.findUnique.mockResolvedValue(mockGroup);

      await expect(service.joinGroup(joinGroupDto, userId)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe("updateMemberRole", () => {
    it("should update member role successfully", async () => {
      const groupId = "group1";
      const memberId = "member2";
      const updateDto = { role: GroupRole.ADMIN };
      const userId = "user1";

      const mockCurrentUserMember = {
        id: "member1",
        userId: "user1",
        groupId: "group1",
        role: GroupRole.ADMIN,
      };

      const mockTargetMember = {
        id: "member2",
        userId: "user2",
        groupId: "group1",
        role: GroupRole.MEMBER,
      };

      const mockUpdatedMember = {
        ...mockTargetMember,
        role: GroupRole.ADMIN,
        user: { id: "user2", name: "Jane Doe", email: "jane@example.com" },
      };

      mockPrismaService.groupMember.findFirst
        .mockResolvedValueOnce(mockCurrentUserMember)
        .mockResolvedValueOnce(mockTargetMember);
      mockPrismaService.groupMember.update.mockResolvedValue(mockUpdatedMember);

      const result = await service.updateMemberRole(
        groupId,
        memberId,
        updateDto,
        userId
      );

      expect(result).toEqual(mockUpdatedMember);
    });

    it("should throw ForbiddenException if user is not admin", async () => {
      const groupId = "group1";
      const memberId = "member2";
      const updateDto = { role: GroupRole.ADMIN };
      const userId = "user2";

      mockPrismaService.groupMember.findFirst.mockResolvedValue(null);

      await expect(
        service.updateMemberRole(groupId, memberId, updateDto, userId)
      ).rejects.toThrow(ForbiddenException);
    });

    it("should throw ForbiddenException if admin tries to demote themselves as only admin", async () => {
      const groupId = "group1";
      const memberId = "member1";
      const updateDto = { role: GroupRole.MEMBER };
      const userId = "user1";

      const mockCurrentUserMember = {
        id: "member1",
        userId: "user1",
        groupId: "group1",
        role: GroupRole.ADMIN,
      };

      mockPrismaService.groupMember.findFirst
        .mockResolvedValueOnce(mockCurrentUserMember)
        .mockResolvedValueOnce(mockCurrentUserMember);
      mockPrismaService.groupMember.count.mockResolvedValue(1);

      await expect(
        service.updateMemberRole(groupId, memberId, updateDto, userId)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("removeMember", () => {
    it("should remove member successfully", async () => {
      const groupId = "group1";
      const memberId = "member2";
      const userId = "user1";

      const mockCurrentUserMember = {
        id: "member1",
        userId: "user1",
        groupId: "group1",
        role: GroupRole.ADMIN,
      };

      const mockTargetMember = {
        id: "member2",
        userId: "user2",
        groupId: "group1",
        role: GroupRole.MEMBER,
      };

      mockPrismaService.groupMember.findFirst
        .mockResolvedValueOnce(mockCurrentUserMember)
        .mockResolvedValueOnce(mockTargetMember);
      mockPrismaService.groupMember.delete.mockResolvedValue({});

      const result = await service.removeMember(groupId, memberId, userId);

      expect(result).toEqual({
        success: true,
        message: "Member removed successfully",
      });
    });

    it("should throw ForbiddenException if user is not admin", async () => {
      const groupId = "group1";
      const memberId = "member2";
      const userId = "user2";

      mockPrismaService.groupMember.findFirst.mockResolvedValue(null);

      await expect(
        service.removeMember(groupId, memberId, userId)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("leaveGroup", () => {
    it("should allow member to leave group", async () => {
      const groupId = "group1";
      const userId = "user2";

      const mockMember = {
        id: "member2",
        userId: "user2",
        groupId: "group1",
        role: GroupRole.MEMBER,
      };

      mockPrismaService.groupMember.findFirst.mockResolvedValue(mockMember);
      mockPrismaService.groupMember.delete.mockResolvedValue({});

      const result = await service.leaveGroup(groupId, userId);

      expect(result).toEqual({
        success: true,
        message: "Left group successfully",
      });
    });

    it("should throw ForbiddenException if only admin tries to leave", async () => {
      const groupId = "group1";
      const userId = "user1";

      const mockMember = {
        id: "member1",
        userId: "user1",
        groupId: "group1",
        role: GroupRole.ADMIN,
      };

      mockPrismaService.groupMember.findFirst.mockResolvedValue(mockMember);
      mockPrismaService.groupMember.count.mockResolvedValue(1);

      await expect(service.leaveGroup(groupId, userId)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe("regenerateInviteCode", () => {
    it("should regenerate invite code successfully", async () => {
      const groupId = "group1";
      const userId = "user1";

      const mockCurrentUserMember = {
        id: "member1",
        userId: "user1",
        groupId: "group1",
        role: GroupRole.ADMIN,
      };

      const mockUpdatedGroup = {
        id: "group1",
        inviteCode: "newinvitecode",
      };

      mockPrismaService.groupMember.findFirst.mockResolvedValue(
        mockCurrentUserMember
      );
      mockPrismaService.group.update.mockResolvedValue(mockUpdatedGroup);

      const result = await service.regenerateInviteCode(groupId, userId);

      expect(result).toEqual({ inviteCode: "newinvitecode" });
    });

    it("should throw ForbiddenException if user is not admin", async () => {
      const groupId = "group1";
      const userId = "user2";

      mockPrismaService.groupMember.findFirst.mockResolvedValue(null);

      await expect(
        service.regenerateInviteCode(groupId, userId)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("createSharedExpense", () => {
    it("should create shared expense with equal split successfully", async () => {
      const groupId = "group1";
      const userId = "user1";
      const createSharedExpenseDto = {
        amount: 100,
        description: "Dinner",
        date: "2024-01-15T19:30:00.000Z",
        splitType: SplitType.EQUAL,
        splits: [
          { userId: "user1", amount: undefined },
          { userId: "user2", amount: undefined },
        ],
      };

      const mockGroup = {
        id: "group1",
        name: "Test Group",
        members: [{ userId: "user1" }, { userId: "user2" }],
      };

      const mockSharedExpense = {
        id: "expense1",
        amount: new Decimal(100),
        description: "Dinner",
        date: new Date("2024-01-15T19:30:00.000Z"),
        payerId: "user1",
        groupId: "group1",
      };

      const mockExpenseWithSplits = {
        ...mockSharedExpense,
        payer: { id: "user1", name: "John", email: "john@example.com" },
        splits: [
          { id: "split1", userId: "user1", amount: new Decimal(50) },
          { id: "split2", userId: "user2", amount: new Decimal(50) },
        ],
      };

      jest.spyOn(service, "findOne").mockResolvedValue(mockGroup as any);
      mockPrismaService.groupMember.findMany.mockResolvedValue([
        { userId: "user1" },
        { userId: "user2" },
      ]);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          sharedExpense: {
            create: jest.fn().mockResolvedValue(mockSharedExpense),
          },
          expenseSplit: { createMany: jest.fn() },
          groupBalance: { upsert: jest.fn() },
        });
      });
      jest
        .spyOn(service, "getSharedExpenseById")
        .mockResolvedValue(mockExpenseWithSplits as any);

      const result = await service.createSharedExpense(
        groupId,
        createSharedExpenseDto,
        userId
      );

      expect(result).toEqual(mockExpenseWithSplits);
    });

    it("should create shared expense with custom split successfully", async () => {
      const groupId = "group1";
      const userId = "user1";
      const createSharedExpenseDto = {
        amount: 100,
        description: "Dinner",
        date: "2024-01-15T19:30:00.000Z",
        splitType: SplitType.CUSTOM,
        splits: [
          { userId: "user1", amount: 60 },
          { userId: "user2", amount: 40 },
        ],
      };

      const mockGroup = {
        id: "group1",
        name: "Test Group",
        members: [{ userId: "user1" }, { userId: "user2" }],
      };

      const mockSharedExpense = {
        id: "expense1",
        amount: new Decimal(100),
        description: "Dinner",
        date: new Date("2024-01-15T19:30:00.000Z"),
        payerId: "user1",
        groupId: "group1",
      };

      jest.spyOn(service, "findOne").mockResolvedValue(mockGroup as any);
      mockPrismaService.groupMember.findMany.mockResolvedValue([
        { userId: "user1" },
        { userId: "user2" },
      ]);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          sharedExpense: {
            create: jest.fn().mockResolvedValue(mockSharedExpense),
          },
          expenseSplit: { createMany: jest.fn() },
          groupBalance: { upsert: jest.fn() },
        });
      });
      jest.spyOn(service, "getSharedExpenseById").mockResolvedValue({} as any);

      await service.createSharedExpense(
        groupId,
        createSharedExpenseDto,
        userId
      );

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it("should throw BadRequestException for invalid custom split amounts", async () => {
      const groupId = "group1";
      const userId = "user1";
      const createSharedExpenseDto = {
        amount: 100,
        description: "Dinner",
        date: "2024-01-15T19:30:00.000Z",
        splitType: SplitType.CUSTOM,
        splits: [
          { userId: "user1", amount: 60 },
          { userId: "user2", amount: 30 }, // Total is 90, not 100
        ],
      };

      const mockGroup = {
        id: "group1",
        name: "Test Group",
        members: [{ userId: "user1" }, { userId: "user2" }],
      };

      jest.spyOn(service, "findOne").mockResolvedValue(mockGroup as any);
      mockPrismaService.groupMember.findMany.mockResolvedValue([
        { userId: "user1" },
        { userId: "user2" },
      ]);

      await expect(
        service.createSharedExpense(groupId, createSharedExpenseDto, userId)
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException for non-member in splits", async () => {
      const groupId = "group1";
      const userId = "user1";
      const createSharedExpenseDto = {
        amount: 100,
        description: "Dinner",
        date: "2024-01-15T19:30:00.000Z",
        splitType: SplitType.EQUAL,
        splits: [
          { userId: "user1", amount: undefined },
          { userId: "user3", amount: undefined }, // user3 is not a member
        ],
      };

      const mockGroup = {
        id: "group1",
        name: "Test Group",
        members: [{ userId: "user1" }, { userId: "user2" }],
      };

      jest.spyOn(service, "findOne").mockResolvedValue(mockGroup as any);
      mockPrismaService.groupMember.findMany.mockResolvedValue([
        { userId: "user1" },
        { userId: "user2" },
      ]);

      await expect(
        service.createSharedExpense(groupId, createSharedExpenseDto, userId)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getSharedExpenses", () => {
    it("should return shared expenses for a group", async () => {
      const groupId = "group1";
      const userId = "user1";
      const mockExpenses = [
        {
          id: "expense1",
          amount: new Decimal(100),
          description: "Dinner",
          date: new Date(),
          payerId: "user1",
          groupId: "group1",
          payer: { id: "user1", name: "John", email: "john@example.com" },
          splits: [],
        },
      ];

      jest.spyOn(service, "findOne").mockResolvedValue({} as any);
      mockPrismaService.sharedExpense.findMany.mockResolvedValue(mockExpenses);

      const result = await service.getSharedExpenses(groupId, userId);

      expect(result).toEqual(mockExpenses);
      expect(mockPrismaService.sharedExpense.findMany).toHaveBeenCalledWith({
        where: { groupId },
        include: {
          payer: {
            select: { id: true, name: true, email: true },
          },
          splits: {
            include: { expense: false },
          },
        },
        orderBy: { date: "desc" },
      });
    });
  });

  describe("getGroupBalances", () => {
    it("should return existing group balances", async () => {
      const groupId = "group1";
      const userId = "user1";
      const mockBalances = [
        {
          id: "balance1",
          userId: "user1",
          groupId: "group1",
          balance: new Decimal(25),
          user: { id: "user1", name: "John", email: "john@example.com" },
        },
      ];

      jest.spyOn(service, "findOne").mockResolvedValue({} as any);
      mockPrismaService.groupBalance.findMany.mockResolvedValue(mockBalances);

      const result = await service.getGroupBalances(groupId, userId);

      expect(result).toEqual(mockBalances);
    });

    it("should create balances if none exist", async () => {
      const groupId = "group1";
      const userId = "user1";
      const mockMembers = [
        {
          userId: "user1",
          user: { id: "user1", name: "John", email: "john@example.com" },
        },
        {
          userId: "user2",
          user: { id: "user2", name: "Jane", email: "jane@example.com" },
        },
      ];

      jest.spyOn(service, "findOne").mockResolvedValue({} as any);
      jest.spyOn(service, "getMembers").mockResolvedValue(mockMembers as any);
      mockPrismaService.groupBalance.findMany
        .mockResolvedValueOnce([]) // First call returns empty
        .mockResolvedValueOnce([]); // Second call after creation
      mockPrismaService.groupBalance.createMany.mockResolvedValue({});
      jest
        .spyOn(service, "getGroupBalances")
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await service.getGroupBalances(groupId, userId);

      expect(mockPrismaService.groupBalance.createMany).toHaveBeenCalledWith({
        data: mockMembers.map((member) => ({
          userId: member.userId,
          groupId: groupId,
          balance: new Decimal(0),
        })),
      });
    });
  });

  describe("splitEqually", () => {
    it("should perform equal split settlement successfully", async () => {
      const groupId = "group1";
      const userId = "user1";
      const splitEquallyDto = { userIds: ["user1", "user2"] };

      const mockCurrentUserMember = {
        id: "member1",
        userId: "user1",
        groupId: "group1",
        role: GroupRole.ADMIN,
      };

      const mockMembers = [{ userId: "user1" }, { userId: "user2" }];

      const mockBalances = [
        {
          id: "balance1",
          userId: "user1",
          groupId: "group1",
          balance: new Decimal(50),
        },
        {
          id: "balance2",
          userId: "user2",
          groupId: "group1",
          balance: new Decimal(-50),
        },
      ];

      mockPrismaService.groupMember.findFirst.mockResolvedValue(
        mockCurrentUserMember
      );
      jest.spyOn(service, "getMembers").mockResolvedValue(mockMembers as any);
      mockPrismaService.groupBalance.findMany.mockResolvedValue(mockBalances);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          groupBalance: { update: jest.fn() },
          settlement: {
            create: jest.fn().mockResolvedValue({ id: "settlement1" }),
          },
        });
      });

      const result = await service.splitEqually(
        groupId,
        splitEquallyDto,
        userId
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe(
        "Equal split settlement completed successfully"
      );
    });

    it("should throw ForbiddenException if user is not admin", async () => {
      const groupId = "group1";
      const userId = "user2";
      const splitEquallyDto = { userIds: ["user1", "user2"] };

      mockPrismaService.groupMember.findFirst.mockResolvedValue(null);

      await expect(
        service.splitEqually(groupId, splitEquallyDto, userId)
      ).rejects.toThrow(ForbiddenException);
    });

    it("should throw BadRequestException for non-member in userIds", async () => {
      const groupId = "group1";
      const userId = "user1";
      const splitEquallyDto = { userIds: ["user1", "user3"] }; // user3 is not a member

      const mockCurrentUserMember = {
        id: "member1",
        userId: "user1",
        groupId: "group1",
        role: GroupRole.ADMIN,
      };

      const mockMembers = [{ userId: "user1" }, { userId: "user2" }];

      mockPrismaService.groupMember.findFirst.mockResolvedValue(
        mockCurrentUserMember
      );
      jest.spyOn(service, "getMembers").mockResolvedValue(mockMembers as any);

      await expect(
        service.splitEqually(groupId, splitEquallyDto, userId)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getSettlements", () => {
    it("should return settlement history for a group", async () => {
      const groupId = "group1";
      const userId = "user1";
      const mockSettlements = [
        {
          id: "settlement1",
          fromId: "user2",
          toId: "user1",
          amount: new Decimal(25),
          groupId: "group1",
          createdAt: new Date(),
          from: { id: "user2", name: "Jane", email: "jane@example.com" },
        },
      ];

      jest.spyOn(service, "findOne").mockResolvedValue({} as any);
      mockPrismaService.settlement.findMany.mockResolvedValue(mockSettlements);

      const result = await service.getSettlements(groupId, userId);

      expect(result).toEqual(mockSettlements);
      expect(mockPrismaService.settlement.findMany).toHaveBeenCalledWith({
        where: { groupId },
        include: {
          from: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    });
  });
});
