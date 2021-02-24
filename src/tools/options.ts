import { FindManyOptions, FindOneOptions } from 'typeorm';

export type FindManyOptionsFunc<T> = (alias: string) => FindManyOptions<T>;
export type FindOneOptionsFunc<T> = (alias: string) => FindOneOptions<T>;
