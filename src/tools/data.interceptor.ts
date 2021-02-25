import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UseInterceptors,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

@Injectable()
export class DataFormatInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        const statusCode = context.switchToHttp().getResponse().statusCode;
        return {
          statusCode,
          data,
        };
      })
    );
  }
}

export const DataFormat = () => UseInterceptors(DataFormatInterceptor);

export interface Format {
  statusCode?: number;
  data?: any;
  error?: string;
  message?: string;
}

export const makeDataFormatResponse = (
  res: Response,
  { statusCode = 200, data, error, message }: Format = {}
) => {
  res.status(statusCode).json({
    statusCode,
    data,
    error,
    message,
  });
};
