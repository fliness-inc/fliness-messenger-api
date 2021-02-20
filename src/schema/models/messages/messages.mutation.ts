import { ObjectType, Field } from '@nestjs/graphql';
import { Message as MessageModel } from './messages.model';
import { IModel } from '@schema/models/model.interface';

@ObjectType()
export class MessagesMutation extends IModel {
  @Field(() => MessageModel)
  public readonly create: MessageModel;

  @Field(() => MessageModel)
  public readonly remove: MessageModel;

  @Field(() => Boolean)
  public readonly setView: boolean;
}

export default MessagesMutation;
