import { Reflector } from '@nestjs/core';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  INestApplication,
} from '@nestjs/common';
import { DataFormatInterceptor } from './tools/data.interceptor';
import * as cookieParser from 'cookie-parser';

export async function initApp(
  app: INestApplication,
  usePrefix = true
): Promise<INestApplication> {
  app.enableCors({
    credentials: true,
    origin: 'http://localhost',
  });
  app.use(cookieParser());
  app.useGlobalInterceptors(
    new DataFormatInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector))
  );
  app.useGlobalPipes(new ValidationPipe());

  if (usePrefix) app.setGlobalPrefix('/v1/api');

  return app;
}

export default initApp;
