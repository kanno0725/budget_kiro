import { LoggerMiddleware } from './logger.middleware';
import { Request, Response, NextFunction } from 'express';

describe('LoggerMiddleware', () => {
  let middleware: LoggerMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    middleware = new LoggerMiddleware();
    mockRequest = {
      method: 'GET',
      originalUrl: '/api/test',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent',
      },
    };
    mockResponse = {
      on: jest.fn(),
      get: jest.fn().mockReturnValue('100'),
    };
    mockNext = jest.fn();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should log request and set up response listener', () => {
    const logSpy = jest.spyOn((middleware as any).logger, 'log');
    
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('📥 GET /api/test - 127.0.0.1 - test-agent'),
    );
    expect(mockResponse.on).toHaveBeenCalledWith('finish', expect.any(Function));
    expect(mockNext).toHaveBeenCalled();
  });
});