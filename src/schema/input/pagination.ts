import {InputType, Field, Int} from '@nestjs/graphql';
import {Cursor} from '@schema/types/cursor';

export function PaginationInput<Fields>(fields: Fields): any {

    @InputType({ isAbstract: true }) 
    abstract class PaginationInputType {
        @Field(type => Cursor, { nullable: true })
        public readonly after?: string;

        @Field(type => Cursor, { nullable: true })
        public readonly before?: string;

        @Field(type => Int, { nullable: true })
        public readonly first?: number;

        @Field(type => Int, { nullable: true })
        public readonly last?: number;

        @Field(type => [fields], { nullable: true }) 
        public readonly fields?: Fields[]
    }

    return PaginationInputType;
}

export default PaginationInput;