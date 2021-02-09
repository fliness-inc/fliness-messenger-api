import { makeFilter, makeEnum, makeEnumField } from '@lib/filter/filter';
import Chats from '@db/entities/chat.entity';
import { InputType, registerEnumType } from '@nestjs/graphql';

export const ChatsFieldArgumentEnum = makeEnum({
  ID: makeEnumField('chats', 'id'),
  TITLE: makeEnumField('chats', 'title'),
  DESCRIPTION: makeEnumField('chats', 'description'),
  CREATED_AT: makeEnumField('chats', 'created_at'),
  TYPE_NAME: makeEnumField('type', 'name')
});

registerEnumType(ChatsFieldArgumentEnum, {
  name: 'ChatsFieldName'
});

@InputType()
export class ChatsFilter extends makeFilter<Chats>(
  Chats,
  ChatsFieldArgumentEnum
) {}
