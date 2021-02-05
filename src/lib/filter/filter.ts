import { Type } from '@nestjs/common';
import { Args } from '@nestjs/graphql';
import * as Filtering from './filtering';
import * as Interceptor from './interceptor';
import * as makeFilter from './make-filter';
import * as Fields from '../fields';

export * from './filtering';
export * from './interceptor';
export * from './make-filter';
export * from '../fields';

export const GraphqlFilterArg = type =>
  Args('filter', {
    type,
    nullable: true
  });

export default {
  ...Filtering,
  ...Interceptor,
  ...makeFilter,
  ...Fields,
  GraphqlFilterArg
};
