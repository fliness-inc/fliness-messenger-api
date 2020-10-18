import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Type } from '@nestjs/common';
import Cursor from '@schema/types/cursor';

@ObjectType()
export class PageInfo {
    @Field(type => Boolean)
    public hasNextPage: boolean;

    @Field(type => Boolean)
    public hasPreviousPage : boolean;

    @Field(type => Cursor)
    public startCursor: string;
        
    @Field(type => Cursor)
    public endCursor: string;
}

export function Connection<T>(classRef: Type<T>): any {

    @ObjectType(`${classRef.name}Edge`)
    abstract class EdgeType {
        @Field(type => Cursor)
        public cursor: string;

        @Field(type => classRef)
        public node: T;
    }

    @ObjectType({ isAbstract: true }) 
    abstract class ConnectionType {
        @Field(type => [EdgeType])
        public edges: EdgeType[];

        @Field(type => Int)
        public totalCount: number;

        @Field(type => PageInfo)
        public pageInfo: PageInfo;
    }

    return ConnectionType;
}