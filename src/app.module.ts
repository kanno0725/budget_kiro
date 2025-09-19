import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { GroupsModule } from './modules/groups/groups.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AppController } from './app.controller';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    TransactionsModule,
    BudgetsModule,
    GroupsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}