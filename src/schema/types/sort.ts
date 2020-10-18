import {InputType, registerEnumType, Field} from '@nestjs/graphql';
import { Order as OrderBy } from '@src/pagination/enums';

registerEnumType(OrderBy, {
    name: 'OrderBy'
});

@InputType('Sort')
export class Sort {
    @Field(type => OrderBy)
    public readonly by: OrderBy 
}

export default Sort;