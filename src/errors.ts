import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  HttpException
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  public catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response: Response = ctx.getResponse();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    response.status(statusCode).json({ statusCode, message });
  }
}

export class InvalidPropertyError extends HttpException {
  public constructor(public readonly message: string = '') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class NotFoundError extends HttpException {
  public constructor(public readonly message: string = '') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class OperationInvalidError extends HttpException {
  public constructor(public readonly message: string = '') {
    super(message, HttpStatus.CONFLICT);
  }
}
