import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { QueryBudgetDto } from './dto/query-budget.dto';
import { Prisma, TransactionType } from '@prisma/client';

export interface BudgetAlert {
  category: string;
  budgetAmount: number;
  actualAmount: number;
  percentage: number;
  alertType: 'warning' | 'exceeded';
}

export interface BudgetReport {
  category: string;
  budgetAmount: number;
  actualAmount: number;
  remaining: number;
  percentage: number;
  status: 'under_budget' | 'warning' | 'exceeded';
}

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createBudgetDto: CreateBudgetDto) {
    const { category, amount, month, year } = createBudgetDto;

    // Check if budget already exists for this user, category, month, and year
    const existingBudget = await this.prisma.budget.findUnique({
      where: {
        userId_category_month_year: {
          userId,
          category,
          month,
          year,
        },
      },
    });

    if (existingBudget) {
      throw new ConflictException('この期間のカテゴリ予算は既に存在します');
    }

    const budget = await this.prisma.budget.create({
      data: {
        category,
        amount,
        month,
        year,
        userId,
      },
    });

    return budget;
  }

  async findAll(userId: string, query: QueryBudgetDto) {
    const { category, month, year } = query;

    const where: Prisma.BudgetWhereInput = {
      userId,
      ...(category && { category: { contains: category, mode: 'insensitive' } }),
      ...(month && { month }),
      ...(year && { year }),
    };

    const budgets = await this.prisma.budget.findMany({
      where,
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { category: 'asc' },
      ],
    });

    return budgets;
  }

  async findOne(id: string, userId: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
    });

    if (!budget) {
      throw new NotFoundException('予算が見つかりません');
    }

    if (budget.userId !== userId) {
      throw new NotFoundException('予算が見つかりません');
    }

    return budget;
  }

  async update(id: string, userId: string, updateBudgetDto: UpdateBudgetDto) {
    // First check if budget exists and belongs to user
    await this.findOne(id, userId);

    const { category, amount, month, year } = updateBudgetDto;

    // If category, month, or year is being updated, check for conflicts
    if (category || month || year) {
      const currentBudget = await this.findOne(id, userId);

      const newCategory = category || currentBudget.category;
      const newMonth = month || currentBudget.month;
      const newYear = year || currentBudget.year;

      const existingBudget = await this.prisma.budget.findUnique({
        where: {
          userId_category_month_year: {
            userId,
            category: newCategory,
            month: newMonth,
            year: newYear,
          },
        },
      });

      if (existingBudget && existingBudget.id !== id) {
        throw new ConflictException('この期間のカテゴリ予算は既に存在します');
      }
    }

    const budget = await this.prisma.budget.update({
      where: { id },
      data: {
        ...(category && { category }),
        ...(amount !== undefined && { amount }),
        ...(month && { month }),
        ...(year && { year }),
      },
    });

    return budget;
  }

  async remove(id: string, userId: string) {
    // First check if budget exists and belongs to user
    await this.findOne(id, userId);

    await this.prisma.budget.delete({
      where: { id },
    });

    return { message: '予算が正常に削除されました' };
  }

  async getBudgetAlerts(userId: string, month?: number, year?: number): Promise<BudgetAlert[]> {
    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();

    // Get all budgets for the specified period
    const budgets = await this.prisma.budget.findMany({
      where: {
        userId,
        month: targetMonth,
        year: targetYear,
      },
    });

    const alerts: BudgetAlert[] = [];

    for (const budget of budgets) {
      // Calculate actual spending for this category in the specified period
      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

      const actualSpending = await this.prisma.transaction.aggregate({
        where: {
          userId,
          category: budget.category,
          type: TransactionType.EXPENSE,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      });

      const actualAmount = Number(actualSpending._sum.amount || 0);
      const budgetAmount = Number(budget.amount);
      const percentage = budgetAmount > 0 ? (actualAmount / budgetAmount) * 100 : 0;

      // Generate alerts for 80% warning and 100% exceeded
      if (percentage >= 80) {
        alerts.push({
          category: budget.category,
          budgetAmount,
          actualAmount,
          percentage,
          alertType: percentage >= 100 ? 'exceeded' : 'warning',
        });
      }
    }

    return alerts;
  }

  async getBudgetReport(userId: string, month?: number, year?: number): Promise<BudgetReport[]> {
    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();

    // Get all budgets for the specified period
    const budgets = await this.prisma.budget.findMany({
      where: {
        userId,
        month: targetMonth,
        year: targetYear,
      },
      orderBy: {
        category: 'asc',
      },
    });

    const report: BudgetReport[] = [];

    for (const budget of budgets) {
      // Calculate actual spending for this category in the specified period
      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

      const actualSpending = await this.prisma.transaction.aggregate({
        where: {
          userId,
          category: budget.category,
          type: TransactionType.EXPENSE,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      });

      const actualAmount = Number(actualSpending._sum.amount || 0);
      const budgetAmount = Number(budget.amount);
      const remaining = budgetAmount - actualAmount;
      const percentage = budgetAmount > 0 ? (actualAmount / budgetAmount) * 100 : 0;

      let status: 'under_budget' | 'warning' | 'exceeded';
      if (percentage >= 100) {
        status = 'exceeded';
      } else if (percentage >= 80) {
        status = 'warning';
      } else {
        status = 'under_budget';
      }

      report.push({
        category: budget.category,
        budgetAmount,
        actualAmount,
        remaining,
        percentage,
        status,
      });
    }

    return report;
  }

  async getBudgetSummary(userId: string, month?: number, year?: number) {
    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();

    const budgets = await this.prisma.budget.findMany({
      where: {
        userId,
        month: targetMonth,
        year: targetYear,
      },
    });

    const totalBudget = budgets.reduce((sum, budget) => sum + Number(budget.amount), 0);

    // Calculate total actual spending for the period
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const actualSpending = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const totalActual = Number(actualSpending._sum.amount || 0);
    const totalRemaining = totalBudget - totalActual;
    const totalPercentage = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

    return {
      month: targetMonth,
      year: targetYear,
      totalBudget,
      totalActual,
      totalRemaining,
      totalPercentage,
      budgetCount: budgets.length,
    };
  }
}