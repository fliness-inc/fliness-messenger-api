import { ObjectType, InputType, registerEnumType } from '@nestjs/graphql';
import Chat from '@schema/models/chats/chats.model';
import { Connection } from '@schema/generics/pagination';
import PaginationInput from '@schema/input/pagination';
import * as Pagination from '@src/pagination/paginator';

export const ChatPaginationField = Pagination.makeEnum({
    ID: Pagination.makeEnumField('chat', 'id'),
    TITLE: Pagination.makeEnumField('chat', 'title'),
    DESCRIPTION: Pagination.makeEnumField('chat', 'description'),
    TYPE: Pagination.makeEnumField('type', 'name'),
});

registerEnumType(ChatPaginationField, {
	name: 'ChatPaginationField'
});

@InputType()
export class ChatPaginationInput extends PaginationInput(ChatPaginationField) {}

@ObjectType()
export class ChatConnection extends Connection(Chat) {}

export default ChatConnection;