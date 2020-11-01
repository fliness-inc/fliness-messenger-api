import { Catch } from '@nestjs/common';
import { GqlExceptionFilter, Info } from '@nestjs/graphql';
import { HttpException } from '@nestjs/common';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { Request, Response } from 'express';
import { ApolloError } from 'apollo-server-express';
import DataLoader from 'dataloader';

export class GqlException extends ApolloError {
	constructor(message: string, code: string, properties?: Record<string, any>) {
		super(message, code, properties);
  
		Object.defineProperty(this, 'name', { value: 'GqlException' });
	}
}

export class Context {
    public req: Request;
    public res: Response;
    public dataloaders: WeakMap<typeof Info, DataLoader<string, any, string>>
}

@Catch(HttpException)
export class GlobalExceptionFilter implements GqlExceptionFilter {
	catch(exception: HttpException) {
		return new GqlException(exception.message, 'API_ERROR', { 
			message: exception.message,
			statusCode: exception.getStatus()
		});
	}
}

export type FindManyOptionsFunc<T> = (alias: string) => FindManyOptions<T>;
export type FindOneOptionsFunc<T> = (alias: string) => FindOneOptions<T>;