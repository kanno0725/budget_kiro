import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TransactionType } from '@prisma/client';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: TransactionsService;

  const mockTransactionsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getCategories: jest.fn(),
    getSummary: jest.fn(),
  };

  const mockUser = {
    id: 'user123',
    name: 'Test User',
    email: 'test@example.com',
  };

  const mockTransaction = {
    id: 'transaction123',
    amount: 1500.50,
    category: '食費',
    description: 'スーパーでの買い物',
    date: new Date('2024-01-15'),
    type: TransactionType.EXPENSE,
    userId: 'user123',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    service = module.get<TransactionsService>(TransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a transaction successfully', async () => {
      const createDto = {
        amount: -1500.50,
        category: '食費',
        description: 'スーパーでの買い物',
        date: '2024-01-15T00:00:00.000Z',
      };

      mockTransactionsService.create.mockResolvedValue(mockTransaction);

      const result = await controller.create(createDto, mockUser);

      expect(mockTransactionsService.create).toHaveBeenCalledWith('user123', createDto);
      expect(result).toEqual({
        success: true,
        data: mockTransaction,
        message: '取引が正常に作成されました',
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated transactions', async () => {
      const query = {
        category: '食費',
        type: TransactionType.EXPENSE,
        page: 1,
        limit: 10,
      };

      const mockResult = {
        data: [mockTransaction],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockTransactionsService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(query, mockUser);

      expect(mockTransactionsService.findAll).toHaveBeenCalledWith('user123', query);
      expect(result).toEqual({
        success: true,
        data: mockResult,
        message: '取引一覧を正常に取得しました',
      });
    });
  });

  describe('getCategories', () => {
    it('should return user categories', async () => {
      const mockCategories = ['食費', '交通費', '娯楽費'];
      mockTransactionsService.getCategories.mockResolvedValue(mockCategories);

      const result = await controller.getCategories(mockUser);

      expect(mockTransactionsService.getCategories).toHaveBeenCalledWith('user123');
      expect(result).toEqual({
        success: true,
        data: mockCategories,
        message: 'カテゴリ一覧を正常に取得しました',
      });
    });
  });

  describe('getSummary', () => {
    it('should return transaction summary', async () => {
      const mockSummary = {
        totalIncome: 5000,
        totalExpense: 3500,
        balance: 1500,
      };

      mockTransactionsService.getSummary.mockResolvedValue(mockSummary);

      const result = await controller.getSummary(undefined, undefined, mockUser);

      expect(mockTransactionsService.getSummary).toHaveBeenCalledWith('user123', undefined, undefined);
      expect(result).toEqual({
        success: true,
        data: mockSummary,
        message: '取引サマリーを正常に取得しました',
      });
    });

    it('should return summary with date filters', async () => {
      const mockSummary = {
        totalIncome: 3000,
        totalExpense: 2000,
        balance: 1000,
      };

      mockTransactionsService.getSummary.mockResolvedValue(mockSummary);

      const result = await controller.getSummary(
        '2024-01-01T00:00:00.000Z',
        '2024-01-31T23:59:59.999Z',
        mockUser
      );

      expect(mockTransactionsService.getSummary).toHaveBeenCalledWith(
        'user123',
        '2024-01-01T00:00:00.000Z',
        '2024-01-31T23:59:59.999Z'
      );
      expect(result).toEqual({
        success: true,
        data: mockSummary,
        message: '取引サマリーを正常に取得しました',
      });
    });
  });

  describe('findOne', () => {
    it('should return a specific transaction', async () => {
      mockTransactionsService.findOne.mockResolvedValue(mockTransaction);

      const result = await controller.findOne('transaction123', mockUser);

      expect(mockTransactionsService.findOne).toHaveBeenCalledWith('transaction123', 'user123');
      expect(result).toEqual({
        success: true,
        data: mockTransaction,
        message: '取引を正常に取得しました',
      });
    });
  });

  describe('update', () => {
    it('should update a transaction successfully', async () => {
      const updateDto = {
        amount: 1600,
        description: '更新された説明',
      };

      const updatedTransaction = { ...mockTransaction, ...updateDto };
      mockTransactionsService.update.mockResolvedValue(updatedTransaction);

      const result = await controller.update('transaction123', updateDto, mockUser);

      expect(mockTransactionsService.update).toHaveBeenCalledWith('transaction123', 'user123', updateDto);
      expect(result).toEqual({
        success: true,
        data: updatedTransaction,
        message: '取引が正常に更新されました',
      });
    });
  });

  describe('remove', () => {
    it('should delete a transaction successfully', async () => {
      const mockResult = { message: '取引が正常に削除されました' };
      mockTransactionsService.remove.mockResolvedValue(mockResult);

      const result = await controller.remove('transaction123', mockUser);

      expect(mockTransactionsService.remove).toHaveBeenCalledWith('transaction123', 'user123');
      expect(result).toEqual({
        success: true,
        data: null,
        message: '取引が正常に削除されました',
      });
    });
  });
});