import { SelectQueryBuilder } from 'typeorm';
import { Cursor, CursorCoder, PaginationFilters } from '@src/pagination/cursor';
import { PaginationQuery } from '@src/pagination/query';
import { Order, Operator, Direction } from '@src/pagination/enums';
import { PaginationResult, PaginationEdge } from '@src/pagination/result';
import Fields from '@src/pagination/fields';

export class PaginatorConfig<Entity> {
    public readonly builder: SelectQueryBuilder<Entity>;
    public readonly uniqueKey: string;
    public readonly keys?: string[];
    public readonly order?: Order;
    public readonly limit?: number;
    public readonly afterCursor?: Cursor;
    public readonly beforeCursor?: Cursor;
    public readonly direction?: Direction;
}

export class Paginator<Entity> {
    private readonly builder: SelectQueryBuilder<Entity>;
    private readonly uniqueKey: string;
    private order: Order;
    private keys: string[];
    private limit: number;
    private afterCursor: Cursor;
    private beforeCursor: Cursor;
    private direction: Direction;
    
    public constructor({ 
    	builder, 
    	keys = [], 
    	uniqueKey,
    	order = Order.ASC, 
    	limit = 100,
    	afterCursor = null,
    	beforeCursor = null,
    	direction = Direction.NEXT
    }: PaginatorConfig<Entity>) {
    	this.builder = builder.clone();
    	this.keys = keys;
    	this.uniqueKey = uniqueKey;
    	this.order = order;
    	this.limit = limit;
    	this.direction = direction;
    	this.afterCursor = afterCursor;
    	this.beforeCursor = beforeCursor;
    }

    private getOperator(order: Order): Operator {
    	if (this.hasAfterCursor())
    		return order === Order.ASC ? Operator.MORE_THEN : Operator.LESS_THEN;

    	if (this.hasBeforeCursor())
    		return order === Order.ASC ? Operator.LESS_THEN : Operator.MORE_THEN;
        
    	return Operator.EQUAL;
    }

    public async paginate(format: (entity: Entity) => any): Promise<PaginationResult<Entity>> {
    	const { builder, keys, order, afterCursor, beforeCursor, limit, direction } = this;

    	const totalCount = await builder.getCount();
    	const firstEntity = await this.getFirstEntity();
    	const lastEntity =  await this.getLastEntity();

    	const edges: PaginationEdge<Entity>[] = [];

    	const query = new PaginationQuery<Entity>(builder);

    	if (this.hasAfterCursor()) {
    		query
    			.filter(CursorCoder.decode(afterCursor), this.getOperator(order))
    			.orderBy(keys, order);
    	}
    	else if (this.hasBeforeCursor()) {
    		query
    			.filter(CursorCoder.decode(beforeCursor), this.getOperator(order))
    			.orderBy(keys, Paginator.flipOrder(order));
    	}
    	else    
    		query.orderBy(keys, direction === Direction.PREVIOUS ? Paginator.flipOrder(order) : order);

    	const entities = await query
    		.take(limit)
    		.build()
    		.getRawMany();

    	Object.assign(entities, direction === Direction.PREVIOUS ? entities.reverse() : entities);
    	Object.assign(edges, this.toResult(entities, format));

    	return {
    		edges,
    		totalCount,
    		pageInfo: {
    			startCursor: entities.length ? CursorCoder.encode(this.preparePaginationFilters(firstEntity)) : null,
    			endCursor: entities.length ? CursorCoder.encode(this.preparePaginationFilters(lastEntity)) : null,
    			hasNextPage: this.hasNextEntity(entities, lastEntity),
    			hasPreviousPage: this.hasPreviousEntity(entities, firstEntity)
    		}
    	};
	}
	
	public hasEntity(entities, hasCursorFn: () => boolean, fn: (key: string) => boolean) {
		const fullFetchedData = entities.length && (entities.length === this.limit || !hasCursorFn());

		const [ table, col ] = this.uniqueKey.replace(/"/g, '').split('.');
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

    public async getFirstEntity(): Promise<Entity> {
    	const { builder, keys, order } = this

    	const query = new PaginationQuery<Entity>(builder);

    	return query
    		.orderBy(keys, order)
    		.build()
    		.getRawOne();
    }

    public async getLastEntity(): Promise<Entity> {
    	const { builder, keys, order } = this;

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

    public setDirection(direction: Direction = Direction.NEXT): Paginator<Entity> {

    	if (direction !== Direction.NEXT && direction !== Direction.PREVIOUS)
    		throw new TypeError(`The direction must be NEXT or PREVIOUS value: ${direction}`);

    	this.direction = direction;
    	return this;
    }

    public setKeys(keys: string[] = []): Paginator<Entity> {
    	if (!Array.isArray(keys))
    		throw new TypeError('The keys must be an array');

    	if (!keys.length)
    		throw new TypeError('The keys must contain at least one key');

    	this.keys = keys;
    	return this;
    }

    private toResult(entities: Entity[], format: (entity: Entity) => any): PaginationEdge<Entity>[] {
    	return entities.map((entity: Entity) => ({
    		cursor: CursorCoder.encode(this.preparePaginationFilters(entity)),
    		node: format(entity)
    	}));
    }

    private preparePaginationFilters(entity: Entity): PaginationFilters {
    	const { keys } = this;
    	const paginationFilters: PaginationFilters = {};

		if (!entity || !keys) return paginationFilters;

    	keys.forEach(key => {
			const [ table, col ] = key.replace(/"/g, '').split('.');
			paginationFilters[key] = entity[Fields.makeFormatedField(table, col)];
    	});

    	return paginationFilters;
    }
}

export default Paginator;