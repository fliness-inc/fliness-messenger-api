import { ObjectType, InputType, registerEnumType } from '@nestjs/graphql';
import Message from '@schema/models/messages/messages.model';
import { Connection } from '@schema/generics/pagination';
import PaginationInput from '@schema/input/pagination';
import Pagination from '@src/pagination/pagination';

export const MessagePaginationField = Pagination.makeEnum({
    ID: Pagination.makeEnumField('message', 'id'),
    TEXT: Pagination.makeEnumField('message', 'text'),
    UPDATED_AT: Pagination.makeEnumField('message', 'updated_at'),
    CREATED_AT: Pagination.makeEnumField('message', 'created_at'),
});

registerEnumType(MessagePaginationField, {
	name: 'MessagePaginationField'
});

@InputType()
export class MessagePaginationInput extends PaginationInput(MessagePaginationField) {}

@ObjectType()
export class MessageConnection extends Connection(Message) {}

export default MessageConnection;