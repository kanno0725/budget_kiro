import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { BudgetsService } from "./budgets.service";
import { PrismaService } from "../../database/prisma.service";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";
import { TransactionType } from "@prisma/client";

describe("BudgetsService", () => {
  let service: BudgetsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    budget: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    transaction: {
      aggregate: jest.fn(),
    },
  };

  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
  };

  const mockBudget = {
    id: "budget-1",
    category: "食費",
    amount: 50000,
    month: 1,
    year: 2024,
    userId: "user-1",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BudgetsService>(BudgetsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    const createBudgetDto: CreateBudgetDto = {
      category: "食費",
      amount: 50000,
      month: 1,
      year: 2024,
    };

    it("should create a budget successfully", async () => {
      mockPrismaService.budget.findUnique.mockResolvedValue(null);
      mockPrismaService.budget.create.mockResolvedValue(mockBudget);

      const result = await service.create(mockUser.id, createBudgetDto);

      expect(mockPrismaService.budget.findUnique).toHaveBeenCalledWith({
        where: {
          userId_category_month_year: {
            userId: mockUser.id,
            category: createBudgetDto.category,
            month: createBudgetDto.month,
            year: createBudgetDto.year,
          },
        },
      });
      expect(mockPrismaService.budget.create).toHaveBeenCalledWith({
        data: {
          ...createBudgetDto,
          userId: mockUser.id,
        },
      });
      expect(result).toEqual(mockBudget);
    });

    it("should throw ConflictException if budget already exists", async () => {
      mockPrismaService.budget.findUnique.mockResolvedValue(mockBudget);

      await expect(
        service.create(mockUser.id, createBudgetDto)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("findAll", () => {
    it("should return all budgets for user", async () => {
      const budgets = [mockBudget];
      mockPrismaService.budget.findMany.mockResolvedValue(budgets);

      const result = await service.findAll(mockUser.id, {});

      expect(mockPrismaService.budget.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        orderBy: [{ year: "desc" }, { month: "desc" }, { category: "asc" }],
      });
      expect(result).toEqual(budgets);
    });

    it("should filter budgets by category", async () => {
      const budgets = [mockBudget];
      mockPrismaService.budget.findMany.mockResolvedValue(budgets);

      await service.findAll(mockUser.id, { category: "食費" });

      expect(mockPrismaService.budget.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          category: { contains: "食費", mode: "insensitive" },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }, { category: "asc" }],
      });
    });
  });

  describe("findOne", () => {
    it("should return a budget by id", async () => {
      mockPrismaService.budget.findUnique.mockResolvedValue(mockBudget);

      const result = await service.findOne(mockBudget.id, mockUser.id);

      expect(mockPrismaService.budget.findUnique).toHaveBeenCalledWith({
        where: { id: mockBudget.id },
      });
      expect(result).toEqual(mockBudget);
    });

    it("should throw NotFoundException if budget not found", async () => {
      mockPrismaService.budget.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne("non-existent", mockUser.id)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException if budget belongs to different user", async () => {
      const otherUserBudget = { ...mockBudget, userId: "other-user" };
      mockPrismaService.budget.findUnique.mockResolvedValue(otherUserBudget);

      await expect(service.findOne(mockBudget.id, mockUser.id)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("update", () => {
    it("should update a budget successfully", async () => {
      const updateBudgetDto: UpdateBudgetDto = {
        amount: 60000,
      };
      const updatedBudget = { ...mockBudget, amount: 60000 };
      mockPrismaService.budget.findUnique.mockResolvedValue(mockBudget);
      mockPrismaService.budget.update.mockResolvedValue(updatedBudget);

      const result = await service.update(
        mockBudget.id,
        mockUser.id,
        updateBudgetDto
      );

      expect(mockPrismaService.budget.update).toHaveBeenCalledWith({
        where: { id: mockBudget.id },
        data: { amount: 60000 },
      });
      expect(result).toEqual(updatedBudget);
    });

    it("should throw ConflictException if updating to existing category/month/year", async () => {
      const updateDto = { category: "交通費" };
      const existingBudget = {
        ...mockBudget,
        id: "other-budget",
        category: "交通費",
      };

      mockPrismaService.budget.findUnique
        .mockResolvedValueOnce(mockBudget) // for findOne check
        .mockResolvedValueOnce(mockBudget) // for current budget in update
        .mockResolvedValueOnce(existingBudget); // for conflict check

      await expect(
        service.update(mockBudget.id, mockUser.id, updateDto)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("remove", () => {
    it("should delete a budget successfully", async () => {
      mockPrismaService.budget.findUnique.mockResolvedValue(mockBudget);
      mockPrismaService.budget.delete.mockResolvedValue(mockBudget);

      const result = await service.remove(mockBudget.id, mockUser.id);

      expect(mockPrismaService.budget.delete).toHaveBeenCalledWith({
        where: { id: mockBudget.id },
      });
      expect(result).toEqual({ message: "予算が正常に削除されました" });
    });
  });

  describe("getBudgetAlerts", () => {
    it("should return budget alerts for exceeded and warning budgets", async () => {
      const budgets = [
        { ...mockBudget, category: "食費", amount: 50000 },
        { ...mockBudget, id: "budget-2", category: "交通費", amount: 30000 },
      ];

      mockPrismaService.budget.findMany.mockResolvedValue(budgets);
      mockPrismaService.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 45000 } }) // 90% of 50000
        .mockResolvedValueOnce({ _sum: { amount: 35000 } }); // 116% of 30000

      const result = await service.getBudgetAlerts(mockUser.id, 1, 2024);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        category: "食費",
        budgetAmount: 50000,
        actualAmount: 45000,
        percentage: 90,
        alertType: "warning",
      });
      expect(result[1]).toEqual({
        category: "交通費",
        budgetAmount: 30000,
        actualAmount: 35000,
        percentage: expect.closeTo(116.67, 1),
        alertType: "exceeded",
      });
    });

    it("should return empty array if no alerts", async () => {
      const budgets = [mockBudget];
      mockPrismaService.budget.findMany.mockResolvedValue(budgets);
      mockPrismaService.transaction.aggregate.mockResolvedValue({
        _sum: { amount: 10000 },
      }); // 20% of 50000

      const result = await service.getBudgetAlerts(mockUser.id, 1, 2024);

      expect(result).toHaveLength(0);
    });
  });

  describe("getBudgetReport", () => {
    it("should return budget vs actual report", async () => {
      const budgets = [mockBudget];
      mockPrismaService.budget.findMany.mockResolvedValue(budgets);
      mockPrismaService.transaction.aggregate.mockResolvedValue({
        _sum: { amount: 45000 },
      });

      const result = await service.getBudgetReport(mockUser.id, 1, 2024);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        category: "食費",
        budgetAmount: 50000,
        actualAmount: 45000,
        remaining: 5000,
        percentage: 90,
        status: "warning",
      });
    });
  });

  describe("getBudgetSummary", () => {
    it("should return budget summary", async () => {
      const budgets = [
        { ...mockBudget, amount: 50000 },
        { ...mockBudget, id: "budget-2", amount: 30000 },
      ];

      mockPrismaService.budget.findMany.mockResolvedValue(budgets);
      mockPrismaService.transaction.aggregate.mockResolvedValue({
        _sum: { amount: 60000 },
      });

      const result = await service.getBudgetSummary(mockUser.id, 1, 2024);

      expect(result).toEqual({
        month: 1,
        year: 2024,
        totalBudget: 80000,
        totalActual: 60000,
        totalRemaining: 20000,
        totalPercentage: 75,
        budgetCount: 2,
      });
    });
  });
});
