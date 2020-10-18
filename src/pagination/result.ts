import {Cursor} from '@src/pagination/cursor';

export class PaginationEdge<Entity> {
    public readonly cursor: Cursor;
    public readonly node: Entity;
}

export class PageInfo {
    public readonly startCursor: string;
    public readonly endCursor: string;
    public readonly hasNextPage: boolean;
    public readonly hasPreviousPage: boolean;
}

export class PaginationResult<Entity> {
    public readonly edges: PaginationEdge<Entity>[];
    public readonly totalCount: number;
    public readonly pageInfo: PageInfo;
}