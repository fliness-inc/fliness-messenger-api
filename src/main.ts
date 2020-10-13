import { NestFactory } from '@nestjs/core';
import { AppModule } from '@src/app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { config as setupDotEnv } from 'dotenv';
import cookieParser from 'cookie-parser';
/* import { GlobalExceptionFilter } from './errors'; */

setupDotEnv();

const { PORT = 8080 } = process.env;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  /* app.useGlobalFilters(new GlobalExceptionFilter()); */

/*   const options = new DocumentBuilder()
    .setTitle('Fliness Messenger API')
    .setDescription('Fliness Messenger API documentation')
    .setVersion('0.0.1')
    .build(); */

 /*  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document); */

  await app.listen(PORT);
}

bootstrap();
