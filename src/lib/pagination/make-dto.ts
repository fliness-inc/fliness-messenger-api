import { InputType, Field, Int } from '@nestjs/graphql';
import { Cursor } from './scalars/cursor.scalar';

export function makeDTO<Fields>(fields: Fields): any {
  @InputType({ isAbstract: true })
  abstract class PaginationInputType {
    @Field(() => Cursor, { nullable: true })
    public readonly after?: string;

    @Field(() => Cursor, { nullable: true })
    public readonly before?: string;

    @Field(() => Int, { nullable: true })
    public readonly first?: number;

    @Field(() => Int, { nullable: true })
    public readonly last?: number;

    @Field(() => [fields], { nullable: true })
    public readonly fields?: Fields[];
  }

  return PaginationInputType;
}

export default makeDTO;
