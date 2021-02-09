import { ObjectType, Field } from '@nestjs/graphql';
import Chat from '@schema/models/chats/chats.model';
import MessagesMutation from '@schema/models/messages/messages.mutation';
import IModel from '@schema/models/model.interface';

@ObjectType()
export class ChatsMutation extends IModel {
  @Field(() => Chat)
  public readonly create: Chat;

  @Field(() => Chat)
  public readonly remove: Chat;

  @Field(() => MessagesMutation)
  public readonly messages: MessagesMutation;
}

export default ChatsMutation;
