import { ObjectType, InputType, registerEnumType } from '@nestjs/graphql';
import Message from '@schema/models/messages/messages.model';
import {
  makeEnumField,
  makeConnection,
  makeDTO,
  makeEnum
} from '@lib/pagination/pagination';

export const MessagePaginationField = makeEnum({
  ID: makeEnumField('messages', 'id'),
  TEXT: makeEnumField('messages', 'text'),
  UPDATED_AT: makeEnumField('messages', 'updated_at'),
  CREATED_AT: makeEnumField('messages', 'created_at')
});

registerEnumType(MessagePaginationField, {
  name: 'MessagePaginationField'
});

@InputType()
export class MessagePaginationInput extends makeDTO(MessagePaginationField) {}

@ObjectType()
export class MessageConnection extends makeConnection(Message) {}

export default MessageConnection;
