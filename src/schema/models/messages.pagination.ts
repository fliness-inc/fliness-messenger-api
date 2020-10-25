import { ObjectType, InputType, registerEnumType } from '@nestjs/graphql';
import Message from '@schema/models/messages.model';
import { Connection } from '@schema/generics/pagination';
import PaginationInput from '@schema/input/pagination';

export enum MessagePaginationField {
    ID = 'message.id',
    TEXT = 'message.text',
    UPDATED_AT = 'message.updatedAt',
    CREATED_AT = 'message.createdAt'
}

registerEnumType(MessagePaginationField, {
    name: 'MessagePaginationField'
});

@InputType()
export class MessagePaginationInput extends PaginationInput(MessagePaginationField) {}

@ObjectType()
export class MessageConnection extends Connection(Message) {}

export default MessageConnection;