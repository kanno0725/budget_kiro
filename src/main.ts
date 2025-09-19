import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  
  const logger = new Logger('Bootstrap');
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Set up global JWT auth guard
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));
  
  app.setGlobalPrefix('api');
  app.enableCors();

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Household Budget API')
    .setDescription('API for managing household budgets, transactions, and shared expenses')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
  logger.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`🔍 Logging level: ${process.env.NODE_ENV === 'development' ? 'DEBUG' : 'INFO'}`);
}
bootstrap();