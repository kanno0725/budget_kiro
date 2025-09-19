import { Test, TestingModule } from "@nestjs/testing";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";

describe("DashboardController", () => {
  let controller: DashboardController;
  let dashboardService: DashboardService;

  const mockDashboardService = {
    getMonthlySummary: jest.fn(),
    getCategoryExpenses: jest.fn(),
    getMonthlyTrends: jest.fn(),
    getDashboardData: jest.fn(),
  };

  const mockUser = { id: "user123", email: "test@example.com" };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockDashboardService,
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    dashboardService = module.get<DashboardService>(DashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getMonthlySummary", () => {
    it("should return monthly summary with success response", async () => {
      const mockSummary = {
        year: 2024,
        month: 1,
        totalIncome: 300000,
        totalExpense: 180000,
        balance: 120000,
      };

      mockDashboardService.getMonthlySummary.mockResolvedValue(mockSummary);

      const result = await controller.getMonthlySummary(2024, 1, mockUser);

      expect(result).toEqual({
        success: true,
        data: mockSummary,
        message: "月次収支サマリーを正常に取得しました",
      });

      expect(mockDashboardService.getMonthlySummary).toHaveBeenCalledWith(
        "user123",
        2024,
        1
      );
    });

    it("should handle undefined year and month parameters", async () => {
      const mockSummary = {
        year: 2024,
        month: 2,
        totalIncome: 250000,
        totalExpense: 150000,
        balance: 100000,
      };

      mockDashboardService.getMonthlySummary.mockResolvedValue(mockSummary);

      const result = await controller.getMonthlySummary(
        undefined,
        undefined,
        mockUser
      );

      expect(result).toEqual({
        success: true,
        data: mockSummary,
        message: "月次収支サマリーを正常に取得しました",
      });

      expect(mockDashboardService.getMonthlySummary).toHaveBeenCalledWith(
        "user123",
        undefined,
        undefined
      );
    });
  });

  describe("getCategoryExpenses", () => {
    it("should return category expenses with success response", async () => {
      const mockCategoryExpenses = [
        { category: "食費", amount: 50000, percentage: 50 },
        { category: "交通費", amount: 30000, percentage: 30 },
        { category: "娯楽費", amount: 20000, percentage: 20 },
      ];

      mockDashboardService.getCategoryExpenses.mockResolvedValue(
        mockCategoryExpenses
      );

      const result = await controller.getCategoryExpenses(
        "2024-01-01",
        "2024-01-31",
        mockUser
      );

      expect(result).toEqual({
        success: true,
        data: mockCategoryExpenses,
        message: "カテゴリ別支出データを正常に取得しました",
      });

      expect(mockDashboardService.getCategoryExpenses).toHaveBeenCalledWith(
        "user123",
        new Date("2024-01-01"),
        new Date("2024-01-31")
      );
    });

    it("should handle undefined date parameters", async () => {
      const mockCategoryExpenses = [
        { category: "食費", amount: 40000, percentage: 100 },
      ];

      mockDashboardService.getCategoryExpenses.mockResolvedValue(
        mockCategoryExpenses
      );

      const result = await controller.getCategoryExpenses(
        undefined,
        undefined,
        mockUser
      );

      expect(result).toEqual({
        success: true,
        data: mockCategoryExpenses,
        message: "カテゴリ別支出データを正常に取得しました",
      });

      expect(mockDashboardService.getCategoryExpenses).toHaveBeenCalledWith(
        "user123",
        undefined,
        undefined
      );
    });
  });

  describe("getMonthlyTrends", () => {
    it("should return monthly trends with success response", async () => {
      const mockTrends = [
        {
          year: 2023,
          month: 12,
          income: 280000,
          expense: 170000,
          balance: 110000,
          date: "2023-12",
        },
        {
          year: 2024,
          month: 1,
          income: 300000,
          expense: 180000,
          balance: 120000,
          date: "2024-01",
        },
      ];

      mockDashboardService.getMonthlyTrends.mockResolvedValue(mockTrends);

      const result = await controller.getMonthlyTrends(6, mockUser);

      expect(result).toEqual({
        success: true,
        data: mockTrends,
        message: "月次推移データを正常に取得しました",
      });

      expect(mockDashboardService.getMonthlyTrends).toHaveBeenCalledWith(
        "user123",
        6
      );
    });

    it("should handle undefined months parameter", async () => {
      const mockTrends = [
        {
          year: 2024,
          month: 1,
          income: 300000,
          expense: 180000,
          balance: 120000,
          date: "2024-01",
        },
      ];

      mockDashboardService.getMonthlyTrends.mockResolvedValue(mockTrends);

      const result = await controller.getMonthlyTrends(undefined, mockUser);

      expect(result).toEqual({
        success: true,
        data: mockTrends,
        message: "月次推移データを正常に取得しました",
      });

      expect(mockDashboardService.getMonthlyTrends).toHaveBeenCalledWith(
        "user123",
        undefined
      );
    });
  });

  describe("getDashboardData", () => {
    it("should return comprehensive dashboard data with success response", async () => {
      const mockDashboardData = {
        summary: {
          totalIncome: 300000,
          totalExpense: 180000,
          balance: 120000,
          period: {
            startDate: "2024-01-01",
            endDate: "2024-01-31",
          },
        },
        categoryExpenses: [
          { category: "食費", amount: 90000, percentage: 50 },
          { category: "交通費", amount: 90000, percentage: 50 },
        ],
        monthlyTrends: [
          {
            year: 2024,
            month: 1,
            income: 300000,
            expense: 180000,
            balance: 120000,
            date: "2024-01",
          },
        ],
      };

      mockDashboardService.getDashboardData.mockResolvedValue(
        mockDashboardData
      );

      const result = await controller.getDashboardData(
        "2024-01-01",
        "2024-01-31",
        mockUser
      );

      expect(result).toEqual({
        success: true,
        data: mockDashboardData,
        message: "ダッシュボードデータを正常に取得しました",
      });

      expect(mockDashboardService.getDashboardData).toHaveBeenCalledWith(
        "user123",
        "2024-01-01",
        "2024-01-31"
      );
    });

    it("should handle undefined date parameters", async () => {
      const mockDashboardData = {
        summary: {
          totalIncome: 250000,
          totalExpense: 150000,
          balance: 100000,
          period: {
            startDate: "2024-02-01",
            endDate: "2024-02-29",
          },
        },
        categoryExpenses: [],
        monthlyTrends: [],
      };

      mockDashboardService.getDashboardData.mockResolvedValue(
        mockDashboardData
      );

      const result = await controller.getDashboardData(
        undefined,
        undefined,
        mockUser
      );

      expect(result).toEqual({
        success: true,
        data: mockDashboardData,
        message: "ダッシュボードデータを正常に取得しました",
      });

      expect(mockDashboardService.getDashboardData).toHaveBeenCalledWith(
        "user123",
        undefined,
        undefined
      );
    });
  });
});
