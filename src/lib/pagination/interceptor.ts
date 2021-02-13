import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UseInterceptors
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Paginator } from './paginator';
import { Direction, Order } from './enums';

export interface GraphqlCursorPaginationOptions {
  readonly uniqueKey: string;
  readonly keys?: string[];
  readonly limit?: number;
  readonly order?: Order;
  readonly direction?: Direction.NEXT;
  readonly formatter?: (node: any) => any;
}

@Injectable()
export class GraphqlCursorPaginationInterceptor<T> implements NestInterceptor {
  constructor(private readonly options: GraphqlCursorPaginationOptions) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const gqlContext = GqlExecutionContext.create(context);
    const { pagination, sort } = gqlContext.getArgs();
    const handle = next.handle();
    const {
      keys,
      uniqueKey,
      limit,
      order,
      direction,
      formatter
    } = this.options;

    return handle.pipe(
      map(async builder => {
        const paginator = new Paginator({
          uniqueKey,
          keys: pagination?.fields || keys,
          afterCursor: pagination?.after,
          beforeCursor: pagination?.before,
          limit: pagination?.first || pagination?.last || limit,
          order: sort?.by || order,
          direction:
            pagination?.last || pagination?.before
              ? Direction.PREVIOUS
              : direction
              ? direction
              : Direction.NEXT
        });

        return paginator.paginate(builder, {
          formatter
        });
      })
    );
  }
}

export function GraphqlCursorPagination<T>(
  options: GraphqlCursorPaginationOptions
) {
  return UseInterceptors(new GraphqlCursorPaginationInterceptor<T>(options));
}

export default GraphqlCursorPagination;
