import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Type } from '@nestjs/common';
import Cursor from '@schema/types/cursor';

@ObjectType()
export class PageInfo {
    @Field(() => Boolean)
    public hasNextPage: boolean;

    @Field(() => Boolean)
    public hasPreviousPage : boolean;

    @Field(() => Cursor)
    public startCursor: string;
        
    @Field(() => Cursor)
    public endCursor: string;
}

export function Connection<T>(classRef: Type<T>): any {

    @ObjectType(`${classRef.name}Edge`)
	abstract class EdgeType {
        @Field(() => Cursor)
        public cursor: string;

        @Field(() => classRef)
        public node: T;
    }

    @ObjectType({ isAbstract: true }) 
    abstract class ConnectionType {
        @Field(() => [EdgeType])
        public edges: EdgeType[];

        @Field(() => Int)
        public totalCount: number;

        @Field(() => PageInfo)
        public pageInfo: PageInfo;
    }

    return ConnectionType;
}