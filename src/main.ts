import { NestFactory } from '@nestjs/core';
import { AppModule } from '@src/app.module';
import { config as setupDotEnv } from 'dotenv';
import cookieParser from 'cookie-parser';
import { GlobalExceptionFilter } from '@schema/utils';

setupDotEnv();

const { PORT = 8080, NODE_ENV = 'production' } = process.env;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalFilters(new GlobalExceptionFilter());

  const server = await app.listen(PORT);
  server.requestTimeout = NODE_ENV === 'production' ? 0 : 60 * 1000; // 60 secs delay
}

bootstrap();
