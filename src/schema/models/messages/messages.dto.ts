import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import UUID from '@schema/types/uuid.type';
import { makeFilter, makeEnum, makeEnumField } from '@lib/filter/filter';
import Messages from '@db/entities/message.entity';

export enum MessageEvents {
  CREATED_EVENT = 'MESSAGE_CREATED_EVENT',
  REMOVED_EVENT = 'MESSAGE_REMOVED_EVENT'
}

@InputType()
export class MessageCreateDTO {
  @Field(() => String, { description: 'The content of your message.' })
  public readonly text: string;

  @Field(() => UUID)
  public readonly chatId: string;
}

export const MessagesFieldArgumentEnum = makeEnum({
  ID: makeEnumField('messages', 'id'),
  TEXT: makeEnumField('messages', 'text'),
  UPDATED_AT: makeEnumField('messages', 'updated_at'),
  CREATED_AT: makeEnumField('messages', 'created_at'),
  MEMBER_ID: makeEnumField('member', 'id'),
  MEMBER_USER_ID: makeEnumField('member', 'user_id'),
  MEMBER_CHAT_ID: makeEnumField('member', 'chat_id')
});

registerEnumType(MessagesFieldArgumentEnum, {
  name: 'MessagesFieldName'
});

@InputType()
export class MessagesFilter extends makeFilter<Messages>(
  Messages,
  MessagesFieldArgumentEnum
) {}
