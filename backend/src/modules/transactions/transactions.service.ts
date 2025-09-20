import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { TransactionType, Prisma } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createTransactionDto: CreateTransactionDto) {
    const { amount, category, description, date, type } = createTransactionDto;
    
    // Auto-determine transaction type based on amount if not provided
    const transactionType = type || (amount >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE);
    
    // Convert amount to absolute value and store the sign in type
    const absoluteAmount = Math.abs(amount);

    const transaction = await this.prisma.transaction.create({
      data: {
        amount: absoluteAmount,
        category,
        description,
        date: new Date(date),
        type: transactionType,
        userId,
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

    return transaction;
  }

  async findAll(userId: string, query: QueryTransactionDto) {
    const { category, type, startDate, endDate, page = 1, limit = 10 } = query;
    
    const skip = (page - 1) * limit;
    
    const where: Prisma.TransactionWhereInput = {
      userId,
      ...(category && { category: { contains: category, mode: 'insensitive' } }),
      ...(type && { type }),
      ...(startDate || endDate) && {
        date: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      },
    };

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
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

    if (!transaction) {
      throw new NotFoundException('取引が見つかりません');
    }

    if (transaction.userId !== userId) {
      throw new ForbiddenException('この取引にアクセスする権限がありません');
    }

    return transaction;
  }

  async update(id: string, userId: string, updateTransactionDto: UpdateTransactionDto) {
    // First check if transaction exists and belongs to user
    await this.findOne(id, userId);

    const { amount, category, description, date, type } = updateTransactionDto;
    
    let transactionType = type;
    let absoluteAmount = amount;

    // Auto-determine transaction type based on amount if amount is provided but type is not
    if (amount !== undefined && type === undefined) {
      transactionType = amount >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE;
      absoluteAmount = Math.abs(amount);
    } else if (amount !== undefined) {
      absoluteAmount = Math.abs(amount);
    }

    const transaction = await this.prisma.transaction.update({
      where: { id },
      data: {
        ...(absoluteAmount !== undefined && { amount: absoluteAmount }),
        ...(category && { category }),
        ...(description !== undefined && { description }),
        ...(date && { date: new Date(date) }),
        ...(transactionType && { type: transactionType }),
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

    return transaction;
  }

  async remove(id: string, userId: string) {
    // First check if transaction exists and belongs to user
    await this.findOne(id, userId);

    await this.prisma.transaction.delete({
      where: { id },
    });

    return { message: '取引が正常に削除されました' };
  }

  async getCategories(userId: string) {
    const categories = await this.prisma.transaction.findMany({
      where: { userId },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    return categories.map(item => item.category);
  }

  async getSummary(userId: string, startDate?: string, endDate?: string) {
    const where: Prisma.TransactionWhereInput = {
      userId,
      ...(startDate || endDate) && {
        date: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
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

    const totalIncome = incomeSum._sum.amount || 0;
    const totalExpense = expenseSum._sum.amount || 0;
    const balance = Number(totalIncome) - Number(totalExpense);

    return {
      totalIncome: Number(totalIncome),
      totalExpense: Number(totalExpense),
      balance,
    };
  }
}