import { ObjectType, Field } from '@nestjs/graphql';
import Message from '@schema/models/messages/messages.model';
import IModel from '@schema/models/model.interface';

@ObjectType()
export class MessagesMutation extends IModel {
  @Field(() => Message)
  public readonly create: Message;

  @Field(() => Message)
  public readonly remove: Message;
}

export default MessagesMutation;
