import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { TransactionsModule } from "./transactions.module";
import { PrismaService } from "../../database/prisma.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { TransactionType } from "@prisma/client";

describe("TransactionsController (Integration)", () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const mockPrismaService = {
    transaction: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockUser = {
    id: "user123",
    name: "Test User",
    email: "test@example.com",
  };

  const mockTransaction = {
    id: "transaction123",
    amount: 1500.5,
    category: "食費",
    description: "スーパーでの買い物",
    date: new Date("2024-01-15"),
    type: TransactionType.EXPENSE,
    userId: "user123",
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TransactionsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    // Mock the request.user for CurrentUser decorator
    app.use((req, res, next) => {
      req.user = mockUser;
      next();
    });

    await app.init();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe("POST /transactions", () => {
    it("should create a transaction successfully", async () => {
      const createDto = {
        amount: 1500.5,
        category: "food",
        description: "Grocery shopping",
        date: "2024-01-15T00:00:00.000Z",
      };

      mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);

      const response = await request(app.getHttpServer())
        .post("/transactions")
        .send(createDto)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: "transaction123",
        }),
        message: "取引が正常に作成されました",
      });
    });

    it("should return validation error for missing required fields", async () => {
      const invalidDto = {
        description: "テスト",
      };

      await request(app.getHttpServer())
        .post("/transactions")
        .send(invalidDto)
        .expect(400);
    });

    it("should return validation error for invalid amount", async () => {
      const invalidDto = {
        amount: "invalid",
        category: "食費",
        date: "2024-01-15T00:00:00.000Z",
      };

      await request(app.getHttpServer())
        .post("/transactions")
        .send(invalidDto)
        .expect(400);
    });

    it("should return validation error for invalid date", async () => {
      const invalidDto = {
        amount: 1500,
        category: "食費",
        date: "invalid-date",
      };

      await request(app.getHttpServer())
        .post("/transactions")
        .send(invalidDto)
        .expect(400);
    });
  });

  describe("GET /transactions", () => {
    it("should return paginated transactions", async () => {
      const mockResult = {
        data: [mockTransaction],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockPrismaService.transaction.findMany.mockResolvedValue([
        mockTransaction,
      ]);
      mockPrismaService.transaction.count.mockResolvedValue(1);

      const response = await request(app.getHttpServer())
        .get("/transactions")
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.objectContaining({
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
          }),
        }),
        message: "取引一覧を正常に取得しました",
      });
    });

    it("should filter transactions by category", async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([
        mockTransaction,
      ]);
      mockPrismaService.transaction.count.mockResolvedValue(1);

      await request(app.getHttpServer())
        .get("/transactions")
        .query({ category: "food" })
        .expect(200);

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: { contains: "food", mode: "insensitive" },
          }),
        })
      );
    });

    it("should filter transactions by type", async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([
        mockTransaction,
      ]);
      mockPrismaService.transaction.count.mockResolvedValue(1);

      await request(app.getHttpServer())
        .get("/transactions")
        .query({ type: "EXPENSE" })
        .expect(200);

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: TransactionType.EXPENSE,
          }),
        })
      );
    });

    it("should filter transactions by date range", async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([
        mockTransaction,
      ]);
      mockPrismaService.transaction.count.mockResolvedValue(1);

      await request(app.getHttpServer())
        .get("/transactions")
        .query({
          startDate: "2024-01-01T00:00:00.000Z",
          endDate: "2024-01-31T23:59:59.999Z",
        })
        .expect(200);

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: {
              gte: new Date("2024-01-01T00:00:00.000Z"),
              lte: new Date("2024-01-31T23:59:59.999Z"),
            },
          }),
        })
      );
    });

    it("should handle pagination parameters", async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([
        mockTransaction,
      ]);
      mockPrismaService.transaction.count.mockResolvedValue(1);

      await request(app.getHttpServer())
        .get("/transactions")
        .query({ page: 2, limit: 5 })
        .expect(200);

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page - 1) * limit = (2 - 1) * 5
          take: 5,
        })
      );
    });
  });

  describe("GET /transactions/categories", () => {
    it("should return user categories", async () => {
      const mockCategories = [
        { category: "food" },
        { category: "transport" },
        { category: "entertainment" },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(mockCategories);

      const response = await request(app.getHttpServer())
        .get("/transactions/categories")
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: ["food", "transport", "entertainment"],
        message: "カテゴリ一覧を正常に取得しました",
      });
    });
  });

  describe("GET /transactions/summary", () => {
    it("should return transaction summary", async () => {
      mockPrismaService.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 5000 } })
        .mockResolvedValueOnce({ _sum: { amount: 3500 } });

      const response = await request(app.getHttpServer())
        .get("/transactions/summary")
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          totalIncome: 5000,
          totalExpense: 3500,
          balance: 1500,
        },
        message: "取引サマリーを正常に取得しました",
      });
    });

    it("should return summary with date filters", async () => {
      mockPrismaService.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 3000 } })
        .mockResolvedValueOnce({ _sum: { amount: 2000 } });

      const response = await request(app.getHttpServer())
        .get("/transactions/summary")
        .query({
          startDate: "2024-01-01T00:00:00.000Z",
          endDate: "2024-01-31T23:59:59.999Z",
        })
        .expect(200);

      expect(response.body.data).toEqual({
        totalIncome: 3000,
        totalExpense: 2000,
        balance: 1000,
      });
    });
  });

  describe("GET /transactions/:id", () => {
    it("should return a specific transaction", async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(
        mockTransaction
      );

      const response = await request(app.getHttpServer())
        .get("/transactions/transaction123")
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: "transaction123",
          category: "食費",
        }),
        message: "取引を正常に取得しました",
      });
    });
  });

  describe("PATCH /transactions/:id", () => {
    it("should update a transaction successfully", async () => {
      const updateDto = {
        amount: 1600,
        description: "Updated description",
      };

      mockPrismaService.transaction.findUnique.mockResolvedValue(
        mockTransaction
      );
      mockPrismaService.transaction.update.mockResolvedValue({
        ...mockTransaction,
        ...updateDto,
      });

      const response = await request(app.getHttpServer())
        .patch("/transactions/transaction123")
        .send(updateDto)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: "transaction123",
        }),
        message: "取引が正常に更新されました",
      });
    });
  });

  describe("DELETE /transactions/:id", () => {
    it("should delete a transaction successfully", async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(
        mockTransaction
      );
      mockPrismaService.transaction.delete.mockResolvedValue(mockTransaction);

      const response = await request(app.getHttpServer())
        .delete("/transactions/transaction123")
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: null,
        message: "取引が正常に削除されました",
      });
    });
  });
});
