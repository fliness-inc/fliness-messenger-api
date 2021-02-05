import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Type } from '@nestjs/common';
import Cursor from './scalars/cursor.scalar';

@ObjectType()
export class PageInfo {
  @Field(() => Boolean)
  public hasNextPage: boolean;

  @Field(() => Boolean)
  public hasPreviousPage: boolean;

  @Field(() => Cursor, { nullable: true })
  public startCursor: string;

  @Field(() => Cursor, { nullable: true })
  public endCursor: string;
}

export function makeConnection<T>(classRef: Type<T>): any {
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

export default makeConnection;
