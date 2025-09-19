import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { ConfigModule } from "@nestjs/config";
import { PrismaService } from "../../database/prisma.service";
import { DashboardModule } from "./dashboard.module";
import { AuthModule } from "../auth/auth.module";
import { JwtService } from "@nestjs/jwt";
import { TransactionType } from "@prisma/client";
import { PrismaModule } from "../../database/prisma.module";

describe("Dashboard Integration Tests", () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        PrismaModule,
        AuthModule,
        DashboardModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();

    // Create test user
    const testUser = await prismaService.user.create({
      data: {
        email: "dashboard-test@example.com",
        password: "hashedpassword",
        name: "Dashboard Test User",
      },
    });
    testUserId = testUser.id;

    // Generate JWT token
    authToken = jwtService.sign({ sub: testUserId, email: testUser.email });

    // Create test transactions
    await prismaService.transaction.createMany({
      data: [
        {
          amount: 300000,
          category: "給与",
          description: "月給",
          date: new Date("2024-01-15"),
          type: TransactionType.INCOME,
          userId: testUserId,
        },
        {
          amount: 50000,
          category: "食費",
          description: "スーパー",
          date: new Date("2024-01-10"),
          type: TransactionType.EXPENSE,
          userId: testUserId,
        },
        {
          amount: 30000,
          category: "交通費",
          description: "定期券",
          date: new Date("2024-01-05"),
          type: TransactionType.EXPENSE,
          userId: testUserId,
        },
        {
          amount: 20000,
          category: "娯楽費",
          description: "映画・食事",
          date: new Date("2024-01-20"),
          type: TransactionType.EXPENSE,
          userId: testUserId,
        },
        // Previous month data
        {
          amount: 280000,
          category: "給与",
          description: "月給",
          date: new Date("2023-12-15"),
          type: TransactionType.INCOME,
          userId: testUserId,
        },
        {
          amount: 45000,
          category: "食費",
          description: "スーパー",
          date: new Date("2023-12-10"),
          type: TransactionType.EXPENSE,
          userId: testUserId,
        },
      ],
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prismaService.transaction.deleteMany({
      where: { userId: testUserId },
    });
    await prismaService.user.delete({
      where: { id: testUserId },
    });

    await app.close();
  });

  describe("GET /dashboard/monthly-summary", () => {
    it("should return monthly summary for current month", async () => {
      const response = await request(app.getHttpServer())
        .get("/dashboard/monthly-summary?year=2024&month=1")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          year: 2024,
          month: 1,
          totalIncome: 300000,
          totalExpense: 100000, // 50000 + 30000 + 20000
          balance: 200000,
        },
        message: "月次収支サマリーを正常に取得しました",
      });
    });

    it("should return monthly summary for previous month", async () => {
      const response = await request(app.getHttpServer())
        .get("/dashboard/monthly-summary?year=2023&month=12")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          year: 2023,
          month: 12,
          totalIncome: 280000,
          totalExpense: 45000,
          balance: 235000,
        },
        message: "月次収支サマリーを正常に取得しました",
      });
    });

    it("should require authentication", async () => {
      await request(app.getHttpServer())
        .get("/dashboard/monthly-summary")
        .expect(401);
    });
  });

  describe("GET /dashboard/category-expenses", () => {
    it("should return category expenses with percentages", async () => {
      const response = await request(app.getHttpServer())
        .get(
          "/dashboard/category-expenses?startDate=2024-01-01&endDate=2024-01-31"
        )
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: "食費",
            amount: 50000,
            percentage: 50,
          }),
          expect.objectContaining({
            category: "交通費",
            amount: 30000,
            percentage: 30,
          }),
          expect.objectContaining({
            category: "娯楽費",
            amount: 20000,
            percentage: 20,
          }),
        ])
      );
      expect(response.body.message).toBe(
        "カテゴリ別支出データを正常に取得しました"
      );
    });

    it("should return empty array when no expenses in period", async () => {
      const response = await request(app.getHttpServer())
        .get(
          "/dashboard/category-expenses?startDate=2024-02-01&endDate=2024-02-28"
        )
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: [],
        message: "カテゴリ別支出データを正常に取得しました",
      });
    });
  });

  describe("GET /dashboard/monthly-trends", () => {
    it("should return monthly trends for specified months", async () => {
      const response = await request(app.getHttpServer())
        .get("/dashboard/monthly-trends?months=2")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);

      // Check that data includes the correct number of months and has proper structure
      const trends = response.body.data;
      const dates = trends.map((trend: any) => trend.date);
      
      // Verify we have 2 months of data
      expect(dates).toHaveLength(2);
      
      // Verify dates are in YYYY-MM format
      dates.forEach((date: string) => {
        expect(date).toMatch(/^\d{4}-\d{2}$/);
      });
      
      // Check that the months are in chronological order (oldest first)
      const sortedDates = [...dates].sort();
      expect(dates).toEqual(sortedDates);

      // Verify structure of trend data
      expect(trends[0]).toEqual(
        expect.objectContaining({
          year: expect.any(Number),
          month: expect.any(Number),
          income: expect.any(Number),
          expense: expect.any(Number),
          balance: expect.any(Number),
          date: expect.stringMatching(/^\d{4}-\d{2}$/),
        })
      );

      expect(response.body.message).toBe("月次推移データを正常に取得しました");
    });

    it("should default to 12 months when no parameter provided", async () => {
      const response = await request(app.getHttpServer())
        .get("/dashboard/monthly-trends")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(12);
    });
  });

  describe("GET /dashboard/data", () => {
    it("should return comprehensive dashboard data", async () => {
      const response = await request(app.getHttpServer())
        .get("/dashboard/data?startDate=2024-01-01&endDate=2024-01-31")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        summary: {
          totalIncome: 300000,
          totalExpense: 100000,
          balance: 200000,
          period: {
            startDate: "2024-01-01",
            endDate: "2024-01-31",
          },
        },
        categoryExpenses: expect.arrayContaining([
          expect.objectContaining({
            category: expect.any(String),
            amount: expect.any(Number),
            percentage: expect.any(Number),
          }),
        ]),
        monthlyTrends: expect.arrayContaining([
          expect.objectContaining({
            year: expect.any(Number),
            month: expect.any(Number),
            income: expect.any(Number),
            expense: expect.any(Number),
            balance: expect.any(Number),
            date: expect.stringMatching(/^\d{4}-\d{2}$/),
          }),
        ]),
      });
      expect(response.body.message).toBe(
        "ダッシュボードデータを正常に取得しました"
      );
    });

    it("should use default dates when not provided", async () => {
      const response = await request(app.getHttpServer())
        .get("/dashboard/data")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary).toEqual(
        expect.objectContaining({
          totalIncome: expect.any(Number),
          totalExpense: expect.any(Number),
          balance: expect.any(Number),
          period: {
            startDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
            endDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          },
        })
      );
    });
  });

  describe("Error handling", () => {
    it("should handle invalid date formats gracefully", async () => {
      const response = await request(app.getHttpServer())
        .get("/dashboard/category-expenses?startDate=invalid-date")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200); // Should still work with default dates

      expect(response.body.success).toBe(true);
    });

    it("should handle invalid month parameter", async () => {
      await request(app.getHttpServer())
        .get("/dashboard/monthly-summary?month=invalid")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400); // Bad request due to ParseIntPipe
    });

    it("should handle invalid months parameter for trends", async () => {
      await request(app.getHttpServer())
        .get("/dashboard/monthly-trends?months=invalid")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400); // Bad request due to ParseIntPipe
    });
  });
});
