import { ObjectType, Field } from '@nestjs/graphql';
import Message from '@schema/models/messages/messages.model';

@ObjectType()
export class MessagesMutation {
  @Field(() => Message)
  public readonly create: Message;

  @Field(() => Message)
  public readonly remove: Message;
}

export default MessagesMutation;
