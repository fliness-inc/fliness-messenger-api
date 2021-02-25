import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import * as dotenv from 'dotenv';
import initApp from './app';
import { AppModule } from './app.module';

dotenv.config();

const { PORT = 8080, NODE_ENV = 'production' } = process.env;

async function bootstrap() {
  const app: INestApplication = await initApp(
    await NestFactory.create<INestApplication>(AppModule)
  );

  const server = await app.listen(PORT);
  server.requestTimeout = NODE_ENV === 'production' ? 0 : 60 * 1000; // 60 sec delay
}
bootstrap();
