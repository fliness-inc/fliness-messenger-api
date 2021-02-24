import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';

dotenv.config();

const { PORT = 8080, NODE_ENV = 'production' } = process.env;

async function bootstrap() {
  const app: INestApplication = await NestFactory.create<INestApplication>(
    AppModule
  );
  app.enableCors({
    credentials: true,
    origin: 'http://localhost',
  });
  app.use(cookieParser());
  app.setGlobalPrefix('/v1/api');

  const server = await app.listen(PORT);
  server.requestTimeout = NODE_ENV === 'production' ? 0 : 60 * 1000; // 60 sec delay
}
bootstrap();
