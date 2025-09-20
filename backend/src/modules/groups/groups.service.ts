import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { CreateSharedExpenseDto, SplitType } from './dto/create-shared-expense.dto';
import { SplitEquallyDto } from './dto/split-equally.dto';
import { SettlementConfirmationDto } from './dto/settlement-confirmation.dto';
import { SettlementPreviewDto } from './dto/settlement-preview.dto';
import { GroupRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { Decimal } from '@prisma/client/runtime/library';

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

  async createSharedExpense(groupId: string, createSharedExpenseDto: CreateSharedExpenseDto, userId: string) {
    // Verify user has access to this group
    await this.findOne(groupId, userId);

    // Validate splits
    await this.validateExpenseSplits(groupId, createSharedExpenseDto);

    // Convert amount to Decimal
    const totalAmount = new Decimal(createSharedExpenseDto.amount);

    // Create shared expense with splits in a transaction
    const result = await this.prisma.$transaction(async (prisma) => {
      // Create the shared expense
      const sharedExpense = await prisma.sharedExpense.create({
        data: {
          amount: totalAmount,
          description: createSharedExpenseDto.description,
          date: new Date(createSharedExpenseDto.date),
          payerId: userId,
          groupId: groupId
        }
      });

      // Create expense splits
      const splits = createSharedExpenseDto.splits.map(split => ({
        expenseId: sharedExpense.id,
        userId: split.userId,
        amount: createSharedExpenseDto.splitType === SplitType.EQUAL 
          ? totalAmount.div(createSharedExpenseDto.splits.length)
          : new Decimal(split.amount!)
      }));

      await prisma.expenseSplit.createMany({
        data: splits
      });

      // Update group balances
      await this.updateGroupBalances(groupId, sharedExpense.id, prisma);

      return sharedExpense;
    });

    // Return the created expense with splits
    return this.getSharedExpenseById(result.id, userId);
  }

  async getSharedExpenses(groupId: string, userId: string) {
    // Verify user has access to this group
    await this.findOne(groupId, userId);

    const expenses = await this.prisma.sharedExpense.findMany({
      where: {
        groupId
      },
      include: {
        payer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        splits: {
          include: {
            expense: false
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    return expenses;
  }

  async getSharedExpenseById(expenseId: string, userId: string) {
    const expense = await this.prisma.sharedExpense.findFirst({
      where: {
        id: expenseId,
        group: {
          members: {
            some: {
              userId
            }
          }
        }
      },
      include: {
        payer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        splits: {
          include: {
            expense: false
          }
        },
        group: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!expense) {
      throw new NotFoundException('Shared expense not found or access denied');
    }

    return expense;
  }

  async getGroupBalances(groupId: string, userId: string) {
    // Verify user has access to this group
    await this.findOne(groupId, userId);

    const balances = await this.prisma.groupBalance.findMany({
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
      }
    });

    // If no balances exist, create them for all group members
    if (balances.length === 0) {
      const members = await this.getMembers(groupId, userId);
      const newBalances = await this.prisma.groupBalance.createMany({
        data: members.map(member => ({
          userId: member.userId,
          groupId: groupId,
          balance: new Decimal(0)
        }))
      });

      return this.getGroupBalances(groupId, userId);
    }

    return balances;
  }

  async splitEqually(groupId: string, splitEquallyDto: SplitEquallyDto, userId: string) {
    // This method is deprecated in favor of executeSettlement
    // Redirect to the new enhanced settlement method
    const settlementConfirmation: SettlementConfirmationDto = {
      confirmed: true,
      userIds: splitEquallyDto.userIds
    };

    const result = await this.executeSettlement(groupId, settlementConfirmation, userId);
    
    // Return in the old format for backward compatibility
    return {
      success: result.success,
      message: result.message,
      settlements: result.data.settlements,
      equalShare: result.data.summary.equalShare
    };
  }

  async getSettlements(groupId: string, userId: string) {
    // Verify user has access to this group
    await this.findOne(groupId, userId);

    const settlements = await this.prisma.settlement.findMany({
      where: {
        groupId
      },
      include: {
        from: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return settlements;
  }

  async previewSettlement(groupId: string, settlementPreviewDto: SettlementPreviewDto, userId: string) {
    // Verify user has access to this group and is admin
    const currentUserMember = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        role: GroupRole.ADMIN
      }
    });

    if (!currentUserMember) {
      throw new ForbiddenException('Only group admins can preview settlements');
    }

    // Determine which users to include in settlement
    let targetUserIds: string[];
    if (settlementPreviewDto.userIds && settlementPreviewDto.userIds.length > 0) {
      targetUserIds = settlementPreviewDto.userIds;
    } else {
      // Include all group members if no specific users provided
      const members = await this.getMembers(groupId, userId);
      targetUserIds = members.map(m => m.userId);
    }

    // Validate that all user IDs are members of the group
    const members = await this.getMembers(groupId, userId);
    const memberIds = members.map(m => m.userId);
    
    for (const targetUserId of targetUserIds) {
      if (!memberIds.includes(targetUserId)) {
        throw new BadRequestException(`User ${targetUserId} is not a member of this group`);
      }
    }

    // Get current balances for the specified users
    const balances = await this.prisma.groupBalance.findMany({
      where: {
        groupId,
        userId: {
          in: targetUserIds
        }
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

    // Calculate total balance and equal share
    const totalBalance = balances.reduce((sum, balance) => sum.add(balance.balance), new Decimal(0));
    const equalShare = totalBalance.div(targetUserIds.length);

    // Calculate what each user would owe or receive
    const settlementPreview = balances.map(balance => {
      const difference = balance.balance.sub(equalShare);
      return {
        user: balance.user,
        currentBalance: balance.balance,
        targetBalance: equalShare,
        adjustment: difference.neg(), // Negative means they owe, positive means they receive
        willOwe: difference.gt(0) ? difference : new Decimal(0),
        willReceive: difference.lt(0) ? difference.neg() : new Decimal(0)
      };
    });

    return {
      totalBalance,
      equalShare,
      participantCount: targetUserIds.length,
      settlementPreview,
      summary: {
        totalOwed: settlementPreview.reduce((sum, item) => sum.add(item.willOwe), new Decimal(0)),
        totalToReceive: settlementPreview.reduce((sum, item) => sum.add(item.willReceive), new Decimal(0))
      }
    };
  }

  async executeSettlement(groupId: string, settlementConfirmationDto: SettlementConfirmationDto, userId: string) {
    if (!settlementConfirmationDto.confirmed) {
      throw new BadRequestException('Settlement must be confirmed to proceed');
    }

    // Verify user has access to this group and is admin
    const currentUserMember = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        role: GroupRole.ADMIN
      }
    });

    if (!currentUserMember) {
      throw new ForbiddenException('Only group admins can execute settlements');
    }

    // Determine which users to include in settlement
    let targetUserIds: string[];
    if (settlementConfirmationDto.userIds && settlementConfirmationDto.userIds.length > 0) {
      targetUserIds = settlementConfirmationDto.userIds;
    } else {
      // Include all group members if no specific users provided
      const members = await this.getMembers(groupId, userId);
      targetUserIds = members.map(m => m.userId);
    }

    // Validate that all user IDs are members of the group
    const members = await this.getMembers(groupId, userId);
    const memberIds = members.map(m => m.userId);
    
    for (const targetUserId of targetUserIds) {
      if (!memberIds.includes(targetUserId)) {
        throw new BadRequestException(`User ${targetUserId} is not a member of this group`);
      }
    }

    // Get current balances for the specified users
    const balances = await this.prisma.groupBalance.findMany({
      where: {
        groupId,
        userId: {
          in: targetUserIds
        }
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

    // Calculate total balance and equal share
    const totalBalance = balances.reduce((sum, balance) => sum.add(balance.balance), new Decimal(0));
    const equalShare = totalBalance.div(targetUserIds.length);

    // Execute settlement in a transaction
    const result = await this.prisma.$transaction(async (prisma) => {
      const settlements = [];
      const updatedBalances = [];

      // Calculate who owes and who receives
      const debtors = [];
      const creditors = [];

      for (const balance of balances) {
        const difference = balance.balance.sub(equalShare);
        
        if (difference.gt(0)) {
          // This user has excess money (creditor)
          creditors.push({
            userId: balance.userId,
            user: balance.user,
            amount: difference
          });
        } else if (difference.lt(0)) {
          // This user owes money (debtor)
          debtors.push({
            userId: balance.userId,
            user: balance.user,
            amount: difference.neg()
          });
        }

        // Update balance to equal share
        const updatedBalance = await prisma.groupBalance.update({
          where: {
            id: balance.id
          },
          data: {
            balance: equalShare
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
        updatedBalances.push(updatedBalance);
      }

      // Create settlement records for money transfers
      for (const debtor of debtors) {
        let remainingDebt = debtor.amount;
        
        for (const creditor of creditors) {
          if (remainingDebt.lte(0) || creditor.amount.lte(0)) continue;
          
          const transferAmount = remainingDebt.lt(creditor.amount) ? remainingDebt : creditor.amount;
          
          // Create settlement record
          const settlement = await prisma.settlement.create({
            data: {
              fromId: debtor.userId,
              toId: creditor.userId,
              amount: transferAmount,
              groupId: groupId
            },
            include: {
              from: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          });
          settlements.push(settlement);
          
          // Update remaining amounts
          remainingDebt = remainingDebt.sub(transferAmount);
          creditor.amount = creditor.amount.sub(transferAmount);
        }
      }

      return {
        settlements,
        updatedBalances,
        totalBalance,
        equalShare,
        participantCount: targetUserIds.length
      };
    });

    return {
      success: true,
      message: 'Settlement executed successfully',
      data: {
        settlements: result.settlements,
        updatedBalances: result.updatedBalances,
        summary: {
          totalBalance: result.totalBalance,
          equalShare: result.equalShare,
          participantCount: result.participantCount,
          settlementsCreated: result.settlements.length
        }
      }
    };
  }

  private async validateExpenseSplits(groupId: string, createSharedExpenseDto: CreateSharedExpenseDto) {
    // Get group members
    const members = await this.prisma.groupMember.findMany({
      where: { groupId }
    });
    const memberIds = members.map(m => m.userId);

    // Validate that all split user IDs are group members
    for (const split of createSharedExpenseDto.splits) {
      if (!memberIds.includes(split.userId)) {
        throw new BadRequestException(`User ${split.userId} is not a member of this group`);
      }
    }

    // For custom splits, validate that amounts sum to total
    if (createSharedExpenseDto.splitType === SplitType.CUSTOM) {
      const totalSplitAmount = createSharedExpenseDto.splits.reduce(
        (sum, split) => sum.add(new Decimal(split.amount || 0)), 
        new Decimal(0)
      );

      const totalAmount = new Decimal(createSharedExpenseDto.amount);
      if (!totalSplitAmount.equals(totalAmount)) {
        throw new BadRequestException('Split amounts must sum to the total expense amount');
      }

      // Ensure all splits have amounts for custom type
      for (const split of createSharedExpenseDto.splits) {
        if (split.amount === undefined || split.amount === null) {
          throw new BadRequestException('Amount is required for each split when using custom split type');
        }
      }
    }

    // Validate no duplicate user IDs in splits
    const splitUserIds = createSharedExpenseDto.splits.map(s => s.userId);
    const uniqueUserIds = new Set(splitUserIds);
    if (splitUserIds.length !== uniqueUserIds.size) {
      throw new BadRequestException('Duplicate user IDs found in splits');
    }
  }

  private async updateGroupBalances(groupId: string, expenseId: string, prisma: any) {
    // Get the expense with splits
    const expense = await prisma.sharedExpense.findUnique({
      where: { id: expenseId },
      include: { splits: true }
    });

    // Update balances for each split
    for (const split of expense.splits) {
      // Upsert group balance
      await prisma.groupBalance.upsert({
        where: {
          userId_groupId: {
            userId: split.userId,
            groupId: groupId
          }
        },
        update: {
          balance: {
            decrement: split.amount
          }
        },
        create: {
          userId: split.userId,
          groupId: groupId,
          balance: split.amount.neg()
        }
      });
    }

    // Update payer's balance (they paid the full amount)
    await prisma.groupBalance.upsert({
      where: {
        userId_groupId: {
          userId: expense.payerId,
          groupId: groupId
        }
      },
      update: {
        balance: {
          increment: expense.amount
        }
      },
      create: {
        userId: expense.payerId,
        groupId: groupId,
        balance: expense.amount
      }
    });
  }

  private generateInviteCode(): string {
    return randomBytes(8).toString('hex');
  }
}