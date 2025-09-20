import { Test, TestingModule } from '@nestjs/testing';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

describe('BudgetsController', () => {
  let controller: BudgetsController;
  let service: BudgetsService;

  const mockBudgetsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getBudgetAlerts: jest.fn(),
    getBudgetReport: jest.fn(),
    getBudgetSummary: jest.fn(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockBudget = {
    id: 'budget-1',
    category: '食費',
    amount: 50000,
    month: 1,
    year: 2024,
    userId: 'user-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetsController],
      providers: [
        {
          provide: BudgetsService,
          useValue: mockBudgetsService,
        },
      ],
    }).compile();

    controller = module.get<BudgetsController>(BudgetsController);
    service = module.get<BudgetsService>(BudgetsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a budget', async () => {
      const createBudgetDto: CreateBudgetDto = {
        category: '食費',
        amount: 50000,
        month: 1,
        year: 2024,
      };

      mockBudgetsService.create.mockResolvedValue(mockBudget);

      const result = await controller.create(mockUser, createBudgetDto);

      expect(mockBudgetsService.create).toHaveBeenCalledWith(mockUser.id, createBudgetDto);
      expect(result).toEqual({
        success: true,
        data: mockBudget,
      });
    });
  });

  describe('findAll', () => {
    it('should return all budgets', async () => {
      const budgets = [mockBudget];
      const query = { category: '食費' };

      mockBudgetsService.findAll.mockResolvedValue(budgets);

      const result = await controller.findAll(mockUser, query);

      expect(mockBudgetsService.findAll).toHaveBeenCalledWith(mockUser.id, query);
      expect(result).toEqual({
        success: true,
        data: budgets,
      });
    });
  });

  describe('getBudgetAlerts', () => {
    it('should return budget alerts', async () => {
      const alerts = [
        {
          category: '食費',
          budgetAmount: 50000,
          actualAmount: 45000,
          percentage: 90,
          alertType: 'warning' as const,
        },
      ];

      mockBudgetsService.getBudgetAlerts.mockResolvedValue(alerts);

      const result = await controller.getBudgetAlerts(mockUser, 1, 2024);

      expect(mockBudgetsService.getBudgetAlerts).toHaveBeenCalledWith(mockUser.id, 1, 2024);
      expect(result).toEqual({
        success: true,
        data: alerts,
      });
    });
  });

  describe('getBudgetReport', () => {
    it('should return budget report', async () => {
      const report = [
        {
          category: '食費',
          budgetAmount: 50000,
          actualAmount: 45000,
          remaining: 5000,
          percentage: 90,
          status: 'warning' as const,
        },
      ];

      mockBudgetsService.getBudgetReport.mockResolvedValue(report);

      const result = await controller.getBudgetReport(mockUser, 1, 2024);

      expect(mockBudgetsService.getBudgetReport).toHaveBeenCalledWith(mockUser.id, 1, 2024);
      expect(result).toEqual({
        success: true,
        data: report,
      });
    });
  });

  describe('getBudgetSummary', () => {
    it('should return budget summary', async () => {
      const summary = {
        month: 1,
        year: 2024,
        totalBudget: 80000,
        totalActual: 60000,
        totalRemaining: 20000,
        totalPercentage: 75,
        budgetCount: 2,
      };

      mockBudgetsService.getBudgetSummary.mockResolvedValue(summary);

      const result = await controller.getBudgetSummary(mockUser, 1, 2024);

      expect(mockBudgetsService.getBudgetSummary).toHaveBeenCalledWith(mockUser.id, 1, 2024);
      expect(result).toEqual({
        success: true,
        data: summary,
      });
    });
  });

  describe('findOne', () => {
    it('should return a budget by id', async () => {
      mockBudgetsService.findOne.mockResolvedValue(mockBudget);

      const result = await controller.findOne(mockBudget.id, mockUser);

      expect(mockBudgetsService.findOne).toHaveBeenCalledWith(mockBudget.id, mockUser.id);
      expect(result).toEqual({
        success: true,
        data: mockBudget,
      });
    });
  });

  describe('update', () => {
    it('should update a budget', async () => {
      const updateBudgetDto: UpdateBudgetDto = {
        amount: 60000,
      };
      const updatedBudget = { ...mockBudget, amount: 60000 };

      mockBudgetsService.update.mockResolvedValue(updatedBudget);

      const result = await controller.update(mockBudget.id, mockUser, updateBudgetDto);

      expect(mockBudgetsService.update).toHaveBeenCalledWith(
        mockBudget.id,
        mockUser.id,
        updateBudgetDto,
      );
      expect(result).toEqual({
        success: true,
        data: updatedBudget,
      });
    });
  });

  describe('remove', () => {
    it('should delete a budget', async () => {
      const deleteResult = { message: '予算が正常に削除されました' };

      mockBudgetsService.remove.mockResolvedValue(deleteResult);

      const result = await controller.remove(mockBudget.id, mockUser);

      expect(mockBudgetsService.remove).toHaveBeenCalledWith(mockBudget.id, mockUser.id);
      expect(result).toEqual(deleteResult);
    });
  });
});