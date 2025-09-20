import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ExportQueryDto } from './dto/export-query.dto';

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async exportTransactions(userId: string, query: ExportQueryDto): Promise<string> {
    const whereClause: any = { userId };

    // Add date filtering
    if (query.startDate || query.endDate) {
      whereClause.date = {};
      if (query.startDate) {
        whereClause.date.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        whereClause.date.lte = new Date(query.endDate);
      }
    }

    // Add category filtering
    if (query.category) {
      whereClause.category = query.category;
    }

    const transactions = await this.prisma.transaction.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    return this.convertTransactionsToCsv(transactions);
  }

  async exportBudgets(userId: string, query: ExportQueryDto): Promise<string> {
    const whereClause: any = { userId };

    // Add category filtering
    if (query.category) {
      whereClause.category = query.category;
    }

    const budgets = await this.prisma.budget.findMany({
      where: whereClause,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    return this.convertBudgetsToCsv(budgets);
  }

  async exportGroupData(userId: string, groupId: string): Promise<string> {
    // Verify user is a member of the group
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId
        }
      }
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        sharedExpenses: {
          include: {
            payer: {
              select: { name: true, email: true }
            },
            splits: true
          },
          orderBy: { date: 'desc' }
        },
        groupBalances: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return this.convertGroupDataToCsv(group);
  }

  private convertTransactionsToCsv(transactions: any[]): string {
    const headers = [
      'ID',
      'Amount',
      'Category', 
      'Description',
      'Date',
      'Type',
      'User Name',
      'User Email',
      'Created At',
      'Updated At'
    ];

    const rows = transactions.map(transaction => [
      transaction.id,
      transaction.amount.toString(),
      transaction.category,
      transaction.description || '',
      transaction.date.toISOString().split('T')[0],
      transaction.type,
      transaction.user.name,
      transaction.user.email,
      transaction.createdAt.toISOString(),
      transaction.updatedAt.toISOString()
    ]);

    return this.arrayToCsv([headers, ...rows]);
  }

  private convertBudgetsToCsv(budgets: any[]): string {
    const headers = [
      'ID',
      'Category',
      'Amount',
      'Month',
      'Year',
      'User Name',
      'User Email'
    ];

    const rows = budgets.map(budget => [
      budget.id,
      budget.category,
      budget.amount.toString(),
      budget.month.toString(),
      budget.year.toString(),
      budget.user.name,
      budget.user.email
    ]);

    return this.arrayToCsv([headers, ...rows]);
  }

  private convertGroupDataToCsv(group: any): string {
    // Create sections for different data types
    let csv = '';

    // Group Information
    csv += 'GROUP INFORMATION\n';
    csv += this.arrayToCsv([
      ['Field', 'Value'],
      ['Group ID', group.id],
      ['Group Name', group.name],
      ['Invite Code', group.inviteCode],
      ['Created At', group.createdAt.toISOString()],
      ['Updated At', group.updatedAt.toISOString()]
    ]);
    csv += '\n\n';

    // Group Members
    csv += 'GROUP MEMBERS\n';
    const memberHeaders = ['User ID', 'Name', 'Email', 'Role'];
    const memberRows = group.members.map(member => [
      member.user.id,
      member.user.name,
      member.user.email,
      member.role
    ]);
    csv += this.arrayToCsv([memberHeaders, ...memberRows]);
    csv += '\n\n';

    // Shared Expenses
    csv += 'SHARED EXPENSES\n';
    const expenseHeaders = [
      'Expense ID',
      'Amount',
      'Description',
      'Date',
      'Payer Name',
      'Payer Email',
      'Created At'
    ];
    const expenseRows = group.sharedExpenses.map(expense => [
      expense.id,
      expense.amount.toString(),
      expense.description,
      expense.date.toISOString().split('T')[0],
      expense.payer.name,
      expense.payer.email,
      expense.createdAt.toISOString()
    ]);
    csv += this.arrayToCsv([expenseHeaders, ...expenseRows]);
    csv += '\n\n';

    // Group Balances
    csv += 'GROUP BALANCES\n';
    const balanceHeaders = ['User Name', 'User Email', 'Balance'];
    const balanceRows = group.groupBalances.map(balance => [
      balance.user.name,
      balance.user.email,
      balance.balance.toString()
    ]);
    csv += this.arrayToCsv([balanceHeaders, ...balanceRows]);

    return csv;
  }

  private arrayToCsv(data: string[][]): string {
    return data
      .map(row => 
        row.map(field => {
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const escaped = field.replace(/"/g, '""');
          return /[",\n\r]/.test(field) ? `"${escaped}"` : escaped;
        }).join(',')
      )
      .join('\n');
  }
}