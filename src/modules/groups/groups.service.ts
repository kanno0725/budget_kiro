import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { GroupRole } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async create(createGroupDto: CreateGroupDto, userId: string) {
    // Generate unique invite code
    const inviteCode = this.generateInviteCode();
    
    // Create group with the creator as admin
    const group = await this.prisma.group.create({
      data: {
        name: createGroupDto.name,
        inviteCode,
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

    return group;
  }

  async findAll(userId: string) {
    const groups = await this.prisma.group.findMany({
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

    return groups;
  }

  async findOne(id: string, userId: string) {
    const group = await this.prisma.group.findFirst({
      where: {
        id,
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
      }
    });

    if (!group) {
      throw new NotFoundException('Group not found or access denied');
    }

    return group;
  }

  async joinGroup(joinGroupDto: JoinGroupDto, userId: string) {
    // Find group by invite code
    const group = await this.prisma.group.findUnique({
      where: {
        inviteCode: joinGroupDto.inviteCode
      },
      include: {
        members: true
      }
    });

    if (!group) {
      throw new NotFoundException('Invalid invite code');
    }

    // Check if user is already a member
    const existingMember = group.members.find(member => member.userId === userId);
    if (existingMember) {
      throw new ConflictException('You are already a member of this group');
    }

    // Add user to group
    await this.prisma.groupMember.create({
      data: {
        userId,
        groupId: group.id,
        role: GroupRole.MEMBER
      }
    });

    // Return updated group
    return this.findOne(group.id, userId);
  }

  async getMembers(groupId: string, userId: string) {
    // Verify user has access to this group
    await this.findOne(groupId, userId);

    const members = await this.prisma.groupMember.findMany({
      where: {
        groupId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { role: 'asc' }, // ADMIN first, then MEMBER
        { user: { name: 'asc' } }
      ]
    });

    return members;
  }

  async updateMemberRole(groupId: string, memberId: string, updateMemberRoleDto: UpdateMemberRoleDto, userId: string) {
    // Check if current user is admin of the group
    const currentUserMember = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        role: GroupRole.ADMIN
      }
    });

    if (!currentUserMember) {
      throw new ForbiddenException('Only group admins can update member roles');
    }

    // Check if target member exists in the group
    const targetMember = await this.prisma.groupMember.findFirst({
      where: {
        id: memberId,
        groupId
      }
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found in this group');
    }

    // Prevent admin from demoting themselves if they are the only admin
    if (targetMember.userId === userId && updateMemberRoleDto.role === GroupRole.MEMBER) {
      const adminCount = await this.prisma.groupMember.count({
        where: {
          groupId,
          role: GroupRole.ADMIN
        }
      });

      if (adminCount === 1) {
        throw new ForbiddenException('Cannot demote the only admin. Promote another member to admin first');
      }
    }

    // Update member role
    const updatedMember = await this.prisma.groupMember.update({
      where: {
        id: memberId
      },
      data: {
        role: updateMemberRoleDto.role
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return updatedMember;
  }

  async removeMember(groupId: string, memberId: string, userId: string) {
    // Check if current user is admin of the group
    const currentUserMember = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        role: GroupRole.ADMIN
      }
    });

    if (!currentUserMember) {
      throw new ForbiddenException('Only group admins can remove members');
    }

    // Check if target member exists in the group
    const targetMember = await this.prisma.groupMember.findFirst({
      where: {
        id: memberId,
        groupId
      }
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found in this group');
    }

    // Prevent admin from removing themselves if they are the only admin
    if (targetMember.userId === userId) {
      const adminCount = await this.prisma.groupMember.count({
        where: {
          groupId,
          role: GroupRole.ADMIN
        }
      });

      if (adminCount === 1) {
        throw new ForbiddenException('Cannot remove the only admin. Promote another member to admin first');
      }
    }

    // Remove member
    await this.prisma.groupMember.delete({
      where: {
        id: memberId
      }
    });

    return { success: true, message: 'Member removed successfully' };
  }

  async leaveGroup(groupId: string, userId: string) {
    // Check if user is a member of the group
    const member = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId
      }
    });

    if (!member) {
      throw new NotFoundException('You are not a member of this group');
    }

    // If user is admin, check if they are the only admin
    if (member.role === GroupRole.ADMIN) {
      const adminCount = await this.prisma.groupMember.count({
        where: {
          groupId,
          role: GroupRole.ADMIN
        }
      });

      if (adminCount === 1) {
        throw new ForbiddenException('Cannot leave group as the only admin. Promote another member to admin first or delete the group');
      }
    }

    // Remove user from group
    await this.prisma.groupMember.delete({
      where: {
        id: member.id
      }
    });

    return { success: true, message: 'Left group successfully' };
  }

  async regenerateInviteCode(groupId: string, userId: string) {
    // Check if current user is admin of the group
    const currentUserMember = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        role: GroupRole.ADMIN
      }
    });

    if (!currentUserMember) {
      throw new ForbiddenException('Only group admins can regenerate invite codes');
    }

    // Generate new invite code
    const newInviteCode = this.generateInviteCode();

    // Update group with new invite code
    const updatedGroup = await this.prisma.group.update({
      where: {
        id: groupId
      },
      data: {
        inviteCode: newInviteCode
      }
    });

    return { inviteCode: updatedGroup.inviteCode };
  }

  private generateInviteCode(): string {
    return randomBytes(8).toString('hex');
  }
}