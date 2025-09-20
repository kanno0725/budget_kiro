import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('API');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, body, query, params, headers } = request;
    const startTime = Date.now();
    
    // 認証情報を安全に取得
    const user = (request as any).user;
    const userId = user?.id || 'anonymous';
    
    // リクエスト詳細ログ
    this.logger.debug(`🔍 Request Details:
      Method: ${method}
      URL: ${url}
      User: ${userId}
      Query: ${JSON.stringify(query)}
      Params: ${JSON.stringify(params)}
      Body: ${this.sanitizeBody(body)}
      User-Agent: ${headers['user-agent'] || 'unknown'}
    `);

    return next.handle().pipe(
      tap((response) => {
        const responseTime = Date.now() - startTime;
        this.logger.log(
          `✅ ${method} ${url} - User: ${userId} - ${responseTime}ms - Success`,
        );
        
        // レスポンスの詳細（開発環境のみ）
        if (process.env.NODE_ENV === 'development') {
          this.logger.debug(`📋 Response: ${JSON.stringify(response).substring(0, 500)}...`);
        }
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;
        this.logger.error(
          `❌ ${method} ${url} - User: ${userId} - ${responseTime}ms - Error: ${error.message}`,
        );
        throw error;
      }),
    );
  }

  private sanitizeBody(body: any): string {
    if (!body) return '{}';
    
    // パスワードなどの機密情報をマスク
    const sanitized = { ...body };
    if (sanitized.password) sanitized.password = '***';
    if (sanitized.confirmPassword) sanitized.confirmPassword = '***';
    
    return JSON.stringify(sanitized);
  }
}