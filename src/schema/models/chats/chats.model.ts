import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import IModel from '@schema/models/model.interface';
import { ChatTypeEnum } from '@schema/models/chats/chats.dto';
import DateTime from '@schema/types/datetime.type';

registerEnumType(ChatTypeEnum, {
  name: 'ChatType'
});

@ObjectType()
export class Chat extends IModel {
  @Field({ nullable: true })
  public readonly title?: string;

  @Field({ nullable: true })
  public readonly description?: string;

  @Field(() => ChatTypeEnum)
  public readonly type: ChatTypeEnum;

  @Field(() => DateTime)
  public readonly createdAt: Date;

  @Field(() => Number)
  public readonly numUnreaded?: number;
}

export default Chat;
