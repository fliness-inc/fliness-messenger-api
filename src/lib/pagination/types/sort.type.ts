import { InputType, registerEnumType, Field } from '@nestjs/graphql';
import { Order } from '../enums';

registerEnumType(Order, {
  name: 'OrderBy'
});

@InputType('Sort')
export class Sort {
  @Field(() => Order)
  public readonly by: Order;
}

export default Sort;
