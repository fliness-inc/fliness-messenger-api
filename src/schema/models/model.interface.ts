import { ObjectType, Field } from '@nestjs/graphql';
import UUID from '@schema/types/uuid.type';

@ObjectType()
export abstract class IModel {
  @Field(() => UUID)
  public readonly id: string;
}

export default IModel;
