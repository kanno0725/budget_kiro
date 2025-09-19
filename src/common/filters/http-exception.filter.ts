import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const user = (request as any).user;
    const userId = user?.id || 'anonymous';

    // エラーログ
    this.logger.error(`
      🚨 Exception caught:
      Status: ${status}
      Method: ${request.method}
      URL: ${request.url}
      User: ${userId}
      Message: ${typeof message === 'string' ? message : JSON.stringify(message)}
      Stack: ${exception instanceof Error ? exception.stack : 'No stack trace'}
    `);

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof message === 'string' ? message : message,
    };

    response.status(status).json(errorResponse);
  }
}