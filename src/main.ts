import { NestFactory } from '@nestjs/core';
import { AppModule } from '@src/app.module';
import { config as setupDotEnv } from 'dotenv';
import cookieParser from 'cookie-parser';
import { GlobalExceptionFilter } from '@schema/utils';

setupDotEnv();

const { PORT = 8080 } = process.env;

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors({
		origin: true,
		credentials: true,
	});
	app.use(cookieParser());
	app.useGlobalFilters(new GlobalExceptionFilter());

	await app.listen(PORT);
}

bootstrap();
