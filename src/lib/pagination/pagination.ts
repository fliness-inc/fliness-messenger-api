import { Args } from '@nestjs/graphql';
import * as Interceptor from './interceptor';
import * as makeConnection from './make-connection';
import * as makeDTO from './make-dto';
import * as Query from './query';
import * as Enums from './enums';
import * as Cursor from './cursor';
import * as Fields from '../fields';
import Sort from './types/sort.type';

export * from './types/sort.type';
export * from '../fields';
export * from './query';
export * from './enums';
export * from './cursor';
export * from './make-dto';
export * from './make-connection';
export * from './interceptor';

export const GraphqlPaginationArg = type =>
  Args('pagination', { type, nullable: true });

export const GraphqlPaginationSortArg = () =>
  Args('sort', { type: () => Sort, nullable: true });

export default {
  ...Interceptor,
  ...makeConnection,
  ...makeDTO,
  ...Query,
  ...Enums,
  ...Cursor,
  ...Fields
};

export interface SelectField {
  table: string;
  column: string;
  alias?: string;
}

export interface makeRepositoryOptions {
  select: SelectField[];
}
