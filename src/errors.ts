import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    public catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response: Response = ctx.getResponse();
        const request: Request = ctx.getRequest();

        const statusCode = exception instanceof HttpException ? 
            exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        const message = exception instanceof HttpException ? 
            exception.message : 'Internal server error';
        
        response.status(statusCode).json({ statusCode, message });
    }
}

export class InvalidPropertyError extends HttpException  {
    public constructor(public readonly message: string = '') {
        super(message, HttpStatus.BAD_REQUEST);
    }
}