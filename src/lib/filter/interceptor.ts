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
import { Filter } from './filtering';

@Injectable()
export class GraphqlFilterInterceptor<T> implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const gqlContext = GqlExecutionContext.create(context);
    const { filter: options } = gqlContext.getArgs();
    const handle = next.handle();

    return handle.pipe(
      map(builder => {
        const filter = new Filter<T>(builder);
        return filter.make(options);
      })
    );
  }
}

export function GraphqlFilter() {
  return UseInterceptors(new GraphqlFilterInterceptor());
}

export default GraphqlFilter;
