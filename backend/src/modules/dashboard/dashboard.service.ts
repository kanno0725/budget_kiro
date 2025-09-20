import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TransactionType, Prisma } from '@prisma/client';

export interface MonthlySummary {
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface CategoryExpense {
  category: string;
  amount: number;
  percentage: number;
}

export interface MonthlyTrend {
  year: number;
  month: number;
  income: number;
  expense: number;
  balance: number;
  date: string; // YYYY-MM format
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  /**
   * 月次収支集計を取得
   * 要件 3.1: 当月の収入・支出の合計を表示
   */
  async getMonthlySummary(
    userId: string,
    year?: number,
    month?: number,
  ): Promise<MonthlySummary> {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    // 月の開始日と終了日を計算
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const where: Prisma.TransactionWhereInput = {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    const [incomeSum, expenseSum] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { ...where, type: TransactionType.INCOME },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...where, type: TransactionType.EXPENSE },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = Number(incomeSum._sum.amount || 0);
    const totalExpense = Number(expenseSum._sum.amount || 0);
    const balance = totalIncome - totalExpense;

    return {
      year: targetYear,
      month: targetMonth,
      totalIncome,
      totalExpense,
      balance,
    };
  }

  /**
   * カテゴリ別支出データを集計
   * 要件 3.2: 円グラフまたは棒グラフで各カテゴリの割合を表示
   */
  async getCategoryExpenses(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<CategoryExpense[]> {
    const now = new Date();
    
    // 無効な日付をチェックして、デフォルト値を使用
    let validStartDate = startDate;
    let validEndDate = endDate;
    
    if (startDate && isNaN(startDate.getTime())) {
      validStartDate = undefined;
    }
    if (endDate && isNaN(endDate.getTime())) {
      validEndDate = undefined;
    }
    
    const defaultStartDate = validStartDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEndDate = validEndDate || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const where: Prisma.TransactionWhereInput = {
      userId,
      type: TransactionType.EXPENSE,
      date: {
        gte: defaultStartDate,
        lte: defaultEndDate,
      },
    };

    // カテゴリ別の支出合計を取得
    const categoryData = await this.prisma.transaction.groupBy({
      by: ['category'],
      where,
      _sum: {
        amount: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
    });

    // 総支出額を計算
    const totalExpense = categoryData.reduce(
      (sum, item) => sum + Number(item._sum.amount || 0),
      0,
    );

    // パーセンテージを計算
    const categoryExpenses: CategoryExpense[] = categoryData.map((item) => {
      const amount = Number(item._sum.amount || 0);
      const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
      
      return {
        category: item.category,
        amount,
        percentage: Math.round(percentage * 100) / 100, // 小数点以下2桁まで
      };
    });

    return categoryExpenses;
  }

  /**
   * 月次推移データを生成
   * 要件 3.3: 過去12ヶ月の収支推移を線グラフで表示
   */
  async getMonthlyTrends(
    userId: string,
    months: number = 12,
  ): Promise<MonthlyTrend[]> {
    const trends: MonthlyTrend[] = [];
    const now = new Date();

    // 過去N ヶ月のデータを取得
    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      const where: Prisma.TransactionWhereInput = {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      };

      const [incomeSum, expenseSum] = await Promise.all([
        this.prisma.transaction.aggregate({
          where: { ...where, type: TransactionType.INCOME },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: { ...where, type: TransactionType.EXPENSE },
          _sum: { amount: true },
        }),
      ]);

      const income = Number(incomeSum._sum.amount || 0);
      const expense = Number(expenseSum._sum.amount || 0);
      const balance = income - expense;

      trends.push({
        year,
        month,
        income,
        expense,
        balance,
        date: `${year}-${month.toString().padStart(2, '0')}`,
      });
    }

    return trends;
  }

  /**
   * 期間指定によるダッシュボードデータを取得
   * 要件 3.4: 選択期間のデータでグラフを更新
   */
  async getDashboardData(
    userId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);

    // 期間の収支サマリー
    const where: Prisma.TransactionWhereInput = {
      userId,
      date: {
        gte: start,
        lte: end,
      },
    };

    const [incomeSum, expenseSum, categoryExpenses] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { ...where, type: TransactionType.INCOME },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...where, type: TransactionType.EXPENSE },
        _sum: { amount: true },
      }),
      this.getCategoryExpenses(userId, start, end),
    ]);

    const totalIncome = Number(incomeSum._sum.amount || 0);
    const totalExpense = Number(expenseSum._sum.amount || 0);
    const balance = totalIncome - totalExpense;

    // 月次推移データ（指定期間内の月ごと）
    const monthlyTrends = await this.getMonthlyTrendsForPeriod(userId, start, end);

    return {
      summary: {
        totalIncome,
        totalExpense,
        balance,
        period: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
        },
      },
      categoryExpenses,
      monthlyTrends,
    };
  }

  /**
   * 指定期間内の月次推移データを取得
   */
  private async getMonthlyTrendsForPeriod(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<MonthlyTrend[]> {
    const trends: MonthlyTrend[] = [];
    
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
    
    let current = new Date(start);
    
    while (current <= end) {
      const year = current.getFullYear();
      const month = current.getMonth() + 1;
      
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

      const where: Prisma.TransactionWhereInput = {
        userId,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      };

      const [incomeSum, expenseSum] = await Promise.all([
        this.prisma.transaction.aggregate({
          where: { ...where, type: TransactionType.INCOME },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: { ...where, type: TransactionType.EXPENSE },
          _sum: { amount: true },
        }),
      ]);

      const income = Number(incomeSum._sum.amount || 0);
      const expense = Number(expenseSum._sum.amount || 0);
      const balance = income - expense;

      trends.push({
        year,
        month,
        income,
        expense,
        balance,
        date: `${year}-${month.toString().padStart(2, '0')}`,
      });

      // 次の月へ
      current.setMonth(current.getMonth() + 1);
    }

    return trends;
  }
}