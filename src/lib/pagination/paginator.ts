import { SelectQueryBuilder } from 'typeorm';
import { Cursor, CursorCoder, PaginationFilters } from './cursor';
import { PaginationQuery } from './query';
import { Order, Operator, Direction } from './enums';
import { PaginationResult, PaginationEdge } from './result';
import Fields from '../fields';
import { makeFormatedField } from './pagination';

export class PaginatorOptions {
  public readonly uniqueKey: string;
  public readonly keys?: string[];
  public readonly order?: Order;
  public readonly limit?: number;
  public readonly afterCursor?: Cursor;
  public readonly beforeCursor?: Cursor;
  public readonly direction?: Direction;
}

export interface PaginateOptions {
  formatter?: (node: any) => any;
}

export class Paginator<Entity> {
  private uniqueKey: string;
  public keys: string[];
  public order: Order;
  public limit: number;
  public afterCursor: Cursor;
  public beforeCursor: Cursor;
  public direction: Direction;

  public constructor(readonly options: PaginatorOptions) {
    const {
      uniqueKey,
      limit = 100,
      keys = [uniqueKey],
      order = Order.ASC,
      afterCursor = null,
      beforeCursor = null,
      direction = Direction.NEXT
    } = options;

    this.uniqueKey = uniqueKey;
    this.keys = keys.includes(uniqueKey) ? keys : [...keys, uniqueKey];
    this.order = order;
    this.limit = limit;
    this.afterCursor = afterCursor;
    this.beforeCursor = beforeCursor;
    this.direction = direction;
  }

  private getOperator(order: Order): Operator {
    if (this.hasAfterCursor())
      return order === Order.ASC ? Operator.MORE_THEN : Operator.LESS_THEN;

    if (this.hasBeforeCursor())
      return order === Order.ASC ? Operator.LESS_THEN : Operator.MORE_THEN;

    return Operator.EQUAL;
  }

  public async paginate(
    builder: SelectQueryBuilder<Entity>,
    options: PaginateOptions = {}
  ): Promise<PaginationResult<Entity>> {
    const { formatter = node => node } = options;
    const totalCount = await builder.getCount();
    const firstEntity = await this.getFirstEntity(
      builder,
      this.keys,
      this.order
    );
    const lastEntity = await this.getLastEntity(builder, this.keys, this.order);
    const query = new PaginationQuery<Entity>(builder);

    if (this.hasAfterCursor()) {
      query
        .filter(
          CursorCoder.decode(this.afterCursor),
          this.getOperator(this.order)
        )
        .orderBy(this.keys, this.order);
    } else if (this.hasBeforeCursor()) {
      query
        .filter(
          CursorCoder.decode(this.beforeCursor),
          this.getOperator(this.order)
        )
        .orderBy(this.keys, Paginator.flipOrder(this.order));
    } else
      query.orderBy(
        this.keys,
        this.direction === Direction.PREVIOUS
          ? Paginator.flipOrder(this.order)
          : this.order
      );

    const entities = await query
      .take(this.limit)
      .build()
      .getRawMany();

    Object.assign(
      entities,
      this.direction === Direction.PREVIOUS ? entities.reverse() : entities
    );

    const edges: PaginationEdge<Entity>[] = entities.map(
      (node: Entity) =>
        new PaginationEdge<Entity>(
          CursorCoder.encode(this.preparePaginationFilters(node)),
          formatter(node)
        )
    );

    return {
      edges,
      totalCount,
      pageInfo: {
        startCursor: entities.length
          ? CursorCoder.encode(this.preparePaginationFilters(firstEntity))
          : null,
        endCursor: entities.length
          ? CursorCoder.encode(this.preparePaginationFilters(lastEntity))
          : null,
        hasNextPage: this.hasNextEntity(entities, lastEntity),
        hasPreviousPage: this.hasPreviousEntity(entities, firstEntity)
      }
    };
  }

  public hasEntity(
    entities,
    hasCursorFn: () => boolean,
    fn: (key: string) => boolean
  ) {
    const fullFetchedData =
      entities.length && (entities.length === this.limit || !hasCursorFn());

    const [table, col] = this.uniqueKey.replace(/"/g, '').split('.');
    const key = Fields.makeFormatedField(table, col);

    return fullFetchedData && fn(key);
  }

  public hasNextEntity(entities: Entity[], lastEntity: Entity): boolean {
    return this.hasEntity(
      entities,
      this.hasAfterCursor.bind(this),
      key => entities[entities.length - 1][key] !== lastEntity[key]
    );
  }

  public hasPreviousEntity(entities: Entity[], firstEntity: Entity): boolean {
    return this.hasEntity(
      entities,
      this.hasBeforeCursor.bind(this),
      key => entities[0][key] !== firstEntity[key]
    );
  }

  public async getFirstEntity(
    builder: SelectQueryBuilder<Entity>,
    keys: string[],
    order: Order
  ): Promise<Entity> {
    const query = new PaginationQuery<Entity>(builder);
    return query
      .orderBy(keys, order)
      .build()
      .getRawOne();
  }

  public async getLastEntity(
    builder: SelectQueryBuilder<Entity>,
    keys: string[],
    order: Order
  ): Promise<Entity> {
    const query = new PaginationQuery<Entity>(builder);
    return query
      .orderBy(keys, Paginator.flipOrder(order))
      .build()
      .getRawOne();
  }

  public static flipOrder(order: Order): Order {
    return order === Order.ASC ? Order.DESC : Order.ASC;
  }

  public setAfterCursor(value: Cursor): Paginator<Entity> {
    this.afterCursor = value;
    return this;
  }

  public hasAfterCursor(): boolean {
    return typeof this.afterCursor === 'string';
  }

  public setBeforeCursor(value: Cursor): Paginator<Entity> {
    this.beforeCursor = value;
    return this;
  }

  public hasBeforeCursor(): boolean {
    return typeof this.beforeCursor === 'string';
  }

  public setLimit(value = 100): Paginator<Entity> {
    if (typeof value !== 'number' || Number.isNaN(value))
      throw new TypeError('The limit must be a valid number');

    this.limit = value;
    return this;
  }

  public setOrder(order: Order = Order.ASC): Paginator<Entity> {
    if (order !== Order.ASC && order !== Order.DESC)
      throw new TypeError(`The order must be ASC or DESC value: ${order}`);

    this.order = order;
    return this;
  }

  public setDirection(
    direction: Direction = Direction.NEXT
  ): Paginator<Entity> {
    if (direction !== Direction.NEXT && direction !== Direction.PREVIOUS)
      throw new TypeError(
        `The direction must be NEXT or PREVIOUS value: ${direction}`
      );

    this.direction = direction;
    return this;
  }

  public setKeys(keys: string[] = []): Paginator<Entity> {
    if (!Array.isArray(keys)) throw new TypeError('The keys must be an array');

    if (!keys.length)
      throw new TypeError('The keys must contain at least one key');

    this.keys = keys;
    return this;
  }

  private preparePaginationFilters(entity: Entity): PaginationFilters {
    const { keys } = this;
    const paginationFilters: PaginationFilters = {};

    if (!entity || !keys) return paginationFilters;

    keys.forEach(key => {
      const [table, col] = key.replace(/"/g, '').split('.');
      paginationFilters[key] = entity[makeFormatedField(table, col)];
    });

    return paginationFilters;
  }
}

export default Paginator;
