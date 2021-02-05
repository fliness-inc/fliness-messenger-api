import { ObjectType, InputType, registerEnumType } from '@nestjs/graphql';
import Chat from '@schema/models/chats/chats.model';
import {
  makeDTO,
  makeConnection,
  makeEnum,
  makeEnumField
} from '@lib/pagination/pagination';

export const ChatPaginationField = makeEnum({
  ID: makeEnumField('chats', 'id'),
  TITLE: makeEnumField('chats', 'title'),
  DESCRIPTION: makeEnumField('chats', 'description'),
  TYPE: makeEnumField('type', 'name')
});

registerEnumType(ChatPaginationField, {
  name: 'ChatPaginationField'
});

@InputType()
export class ChatPaginationInput extends makeDTO(ChatPaginationField) {}

@ObjectType()
export class ChatConnection extends makeConnection(Chat) {}

export default ChatConnection;
