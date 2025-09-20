import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger("HTTP");

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers["user-agent"] || "";
    const startTime = Date.now();

    // リクエストログ
    this.logger.log(`📥 ${method} ${originalUrl} - ${ip} - ${userAgent}`);

    // レスポンス完了時のログ
    res.on("finish", () => {
      const { statusCode } = res;
      const contentLength = res.get("content-length") || 0;
      const responseTime = Date.now() - startTime;

      const statusEmoji = this.getStatusEmoji(statusCode);

      this.logger.log(
        `📤 ${statusEmoji} ${method} ${originalUrl} ${statusCode} ${contentLength}bytes - ${responseTime}ms`
      );
    });

    next();
  }

  private getStatusEmoji(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return "✅";
    if (statusCode >= 300 && statusCode < 400) return "🔄";
    if (statusCode >= 400 && statusCode < 500) return "⚠️";
    if (statusCode >= 500) return "❌";
    return "📋";
  }
}
