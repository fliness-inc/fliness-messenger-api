import { SelectQueryBuilder, OrderByCondition, Brackets } from 'typeorm';
import { Operator, Order } from './enums';
import { PaginationFilters } from './cursor';

export class PaginationQuery<Entity> {
  private readonly builder: SelectQueryBuilder<Entity>;

  public constructor(builder: SelectQueryBuilder<Entity>) {
    this.builder = builder.clone();
  }

  public filter(
    filters: PaginationFilters,
    operator: Operator = Operator.MORE_THEN
  ): PaginationQuery<Entity> {
    let query = '';

    this.builder.andWhere(
      new Brackets(qb => {
        Object.entries(filters).forEach(filter => {
          const [key] = filter;

          const [table, col] = key.replace(/"/g, '').split('.');
          const keyParam = `${table}_${col}`;

          qb.orWhere(`${query}${key} ${operator} :${keyParam}`, {
            [keyParam]: filters[key]
          });
          query = `${query}${key} = :${keyParam} AND `;
        });
      })
    );

    return this;
  }

  public orderBy(
    keys: string[],
    order: Order = Order.ASC
  ): PaginationQuery<Entity> {
    const orderByCondition: OrderByCondition = {};

    keys.forEach(key => (orderByCondition[`${key}`] = order));

    this.builder.orderBy(orderByCondition);
    return this;
  }

  public take(value: number): PaginationQuery<Entity> {
    this.builder.limit(value);
    return this;
  }

  public build(): SelectQueryBuilder<Entity> {
    return this.builder.clone();
  }
}
