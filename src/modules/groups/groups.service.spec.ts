import { Test, TestingModule } from '@nestjs/testing';
import { GroupsService } from './groups.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { GroupRole } from '@prisma/client';

describe('GroupsService', () => {
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

  describe('create', () => {
    it('should create a group with the creator as admin', async () => {
      const createGroupDto = { name: 'Test Group' };
      const userId = 'user1';
      const mockGroup = {
        id: 'group1',
        name: 'Test Group',
        inviteCode: 'abc123def456',
        createdAt: new Date(),
        updatedAt: new Date(),
        members: [
          {
            id: 'member1',
            userId: 'user1',
            groupId: 'group1',
            role: GroupRole.ADMIN,
            user: {
              id: 'user1',
              name: 'John Doe',
              email: 'john@example.com'
            }
          }
        ]
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
              role: GroupRole.ADMIN
            }
          }
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });
      expect(result).toEqual(mockGroup);
    });
  });

  describe('findAll', () => {
    it('should return all groups for a user', async () => {
      const userId = 'user1';
      const mockGroups = [
        {
          id: 'group1',
          name: 'Test Group',
          inviteCode: 'abc123',
          createdAt: new Date(),
          updatedAt: new Date(),
          members: [],
          _count: { members: 2, sharedExpenses: 3 }
        }
      ];

      mockPrismaService.group.findMany.mockResolvedValue(mockGroups);

      const result = await service.findAll(userId);

      expect(mockPrismaService.group.findMany).toHaveBeenCalledWith({
        where: {
          members: {
            some: {
              userId
            }
          }
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          _count: {
            select: {
              members: true,
              sharedExpenses: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      expect(result).toEqual(mockGroups);
    });
  });

  describe('findOne', () => {
    it('should return a group if user has access', async () => {
      const groupId = 'group1';
      const userId = 'user1';
      const mockGroup = {
        id: 'group1',
        name: 'Test Group',
        inviteCode: 'abc123',
        members: [],
        _count: { members: 2, sharedExpenses: 3 }
      };

      mockPrismaService.group.findFirst.mockResolvedValue(mockGroup);

      const result = await service.findOne(groupId, userId);

      expect(result).toEqual(mockGroup);
    });

    it('should throw NotFoundException if group not found or no access', async () => {
      const groupId = 'group1';
      const userId = 'user1';

      mockPrismaService.group.findFirst.mockResolvedValue(null);

      await expect(service.findOne(groupId, userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('joinGroup', () => {
    it('should add user to group successfully', async () => {
      const joinGroupDto = { inviteCode: 'abc123' };
      const userId = 'user2';
      const mockGroup = {
        id: 'group1',
        name: 'Test Group',
        inviteCode: 'abc123',
        members: [
          { id: 'member1', userId: 'user1', groupId: 'group1', role: GroupRole.ADMIN }
        ]
      };

      mockPrismaService.group.findUnique.mockResolvedValue(mockGroup);
      mockPrismaService.groupMember.create.mockResolvedValue({});
      
      // Mock findOne for return value
      const mockUpdatedGroup = { ...mockGroup, members: [...mockGroup.members, { userId: 'user2' }] };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUpdatedGroup as any);

      const result = await service.joinGroup(joinGroupDto, userId);

      expect(mockPrismaService.groupMember.create).toHaveBeenCalledWith({
        data: {
          userId,
          groupId: mockGroup.id,
          role: GroupRole.MEMBER
        }
      });
      expect(result).toEqual(mockUpdatedGroup);
    });

    it('should throw NotFoundException for invalid invite code', async () => {
      const joinGroupDto = { inviteCode: 'invalid' };
      const userId = 'user2';

      mockPrismaService.group.findUnique.mockResolvedValue(null);

      await expect(service.joinGroup(joinGroupDto, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if user is already a member', async () => {
      const joinGroupDto = { inviteCode: 'abc123' };
      const userId = 'user1';
      const mockGroup = {
        id: 'group1',
        members: [
          { id: 'member1', userId: 'user1', groupId: 'group1', role: GroupRole.ADMIN }
        ]
      };

      mockPrismaService.group.findUnique.mockResolvedValue(mockGroup);

      await expect(service.joinGroup(joinGroupDto, userId)).rejects.toThrow(ConflictException);
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role successfully', async () => {
      const groupId = 'group1';
      const memberId = 'member2';
      const updateDto = { role: GroupRole.ADMIN };
      const userId = 'user1';

      const mockCurrentUserMember = {
        id: 'member1',
        userId: 'user1',
        groupId: 'group1',
        role: GroupRole.ADMIN
      };

      const mockTargetMember = {
        id: 'member2',
        userId: 'user2',
        groupId: 'group1',
        role: GroupRole.MEMBER
      };

      const mockUpdatedMember = {
        ...mockTargetMember,
        role: GroupRole.ADMIN,
        user: { id: 'user2', name: 'Jane Doe', email: 'jane@example.com' }
      };

      mockPrismaService.groupMember.findFirst
        .mockResolvedValueOnce(mockCurrentUserMember)
        .mockResolvedValueOnce(mockTargetMember);
      mockPrismaService.groupMember.update.mockResolvedValue(mockUpdatedMember);

      const result = await service.updateMemberRole(groupId, memberId, updateDto, userId);

      expect(result).toEqual(mockUpdatedMember);
    });

    it('should throw ForbiddenException if user is not admin', async () => {
      const groupId = 'group1';
      const memberId = 'member2';
      const updateDto = { role: GroupRole.ADMIN };
      const userId = 'user2';

      mockPrismaService.groupMember.findFirst.mockResolvedValue(null);

      await expect(service.updateMemberRole(groupId, memberId, updateDto, userId)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if admin tries to demote themselves as only admin', async () => {
      const groupId = 'group1';
      const memberId = 'member1';
      const updateDto = { role: GroupRole.MEMBER };
      const userId = 'user1';

      const mockCurrentUserMember = {
        id: 'member1',
        userId: 'user1',
        groupId: 'group1',
        role: GroupRole.ADMIN
      };

      mockPrismaService.groupMember.findFirst
        .mockResolvedValueOnce(mockCurrentUserMember)
        .mockResolvedValueOnce(mockCurrentUserMember);
      mockPrismaService.groupMember.count.mockResolvedValue(1);

      await expect(service.updateMemberRole(groupId, memberId, updateDto, userId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeMember', () => {
    it('should remove member successfully', async () => {
      const groupId = 'group1';
      const memberId = 'member2';
      const userId = 'user1';

      const mockCurrentUserMember = {
        id: 'member1',
        userId: 'user1',
        groupId: 'group1',
        role: GroupRole.ADMIN
      };

      const mockTargetMember = {
        id: 'member2',
        userId: 'user2',
        groupId: 'group1',
        role: GroupRole.MEMBER
      };

      mockPrismaService.groupMember.findFirst
        .mockResolvedValueOnce(mockCurrentUserMember)
        .mockResolvedValueOnce(mockTargetMember);
      mockPrismaService.groupMember.delete.mockResolvedValue({});

      const result = await service.removeMember(groupId, memberId, userId);

      expect(result).toEqual({ success: true, message: 'Member removed successfully' });
    });

    it('should throw ForbiddenException if user is not admin', async () => {
      const groupId = 'group1';
      const memberId = 'member2';
      const userId = 'user2';

      mockPrismaService.groupMember.findFirst.mockResolvedValue(null);

      await expect(service.removeMember(groupId, memberId, userId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('leaveGroup', () => {
    it('should allow member to leave group', async () => {
      const groupId = 'group1';
      const userId = 'user2';

      const mockMember = {
        id: 'member2',
        userId: 'user2',
        groupId: 'group1',
        role: GroupRole.MEMBER
      };

      mockPrismaService.groupMember.findFirst.mockResolvedValue(mockMember);
      mockPrismaService.groupMember.delete.mockResolvedValue({});

      const result = await service.leaveGroup(groupId, userId);

      expect(result).toEqual({ success: true, message: 'Left group successfully' });
    });

    it('should throw ForbiddenException if only admin tries to leave', async () => {
      const groupId = 'group1';
      const userId = 'user1';

      const mockMember = {
        id: 'member1',
        userId: 'user1',
        groupId: 'group1',
        role: GroupRole.ADMIN
      };

      mockPrismaService.groupMember.findFirst.mockResolvedValue(mockMember);
      mockPrismaService.groupMember.count.mockResolvedValue(1);

      await expect(service.leaveGroup(groupId, userId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('regenerateInviteCode', () => {
    it('should regenerate invite code successfully', async () => {
      const groupId = 'group1';
      const userId = 'user1';

      const mockCurrentUserMember = {
        id: 'member1',
        userId: 'user1',
        groupId: 'group1',
        role: GroupRole.ADMIN
      };

      const mockUpdatedGroup = {
        id: 'group1',
        inviteCode: 'newinvitecode'
      };

      mockPrismaService.groupMember.findFirst.mockResolvedValue(mockCurrentUserMember);
      mockPrismaService.group.update.mockResolvedValue(mockUpdatedGroup);

      const result = await service.regenerateInviteCode(groupId, userId);

      expect(result).toEqual({ inviteCode: 'newinvitecode' });
    });

    it('should throw ForbiddenException if user is not admin', async () => {
      const groupId = 'group1';
      const userId = 'user2';

      mockPrismaService.groupMember.findFirst.mockResolvedValue(null);

      await expect(service.regenerateInviteCode(groupId, userId)).rejects.toThrow(ForbiddenException);
    });
  });
});