import { ObjectType, InputType, registerEnumType } from '@nestjs/graphql';
import Chat from '@schema/models/chats.model';
import { Connection } from '@schema/generics/pagination';
import PaginationInput from '@schema/input/pagination';

export enum ChatPaginationField {
    ID = 'chat.id',
    TITLE = 'chat.title',
    DESCRIPTION = 'chat.description',
    TYPE = 'type.name'
}

registerEnumType(ChatPaginationField, {
    name: 'ChatPaginationField'
});

@InputType()
export class ChatPaginationInput extends PaginationInput(ChatPaginationField) {}

@ObjectType()
export class ChatConnection extends Connection(Chat) {}

export default ChatConnection;