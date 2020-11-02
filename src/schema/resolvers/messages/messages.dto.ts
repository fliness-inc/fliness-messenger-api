import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import UUID from '@schema/types/uuid';
import Filter from '@schema/generics/filter';
import Messages from '@database/entities/message';

@InputType()
export class MessageCreateDTO {
    @Field(() => String, { description: 'The content of your message.' })
    public readonly text: string;

    @Field(() => UUID)
    public readonly chatId: string;
}

export enum MessagesFieldArgumentEnum {
    ID = '"message"."id"',
    TEXT = '"message"."text"',
    UPDATED_AT = '"message"."updated_at"',
    CREATED_AT = '"message"."created_at"',
    MEMBER_ID = '"member"."id"',
    MEMBER_USER_ID = '"member"."user_id"',
    MEMBER_CHAT_ID = '"member"."chat_id"'
}

registerEnumType(MessagesFieldArgumentEnum, {
	name: 'MessagesFieldName'
});

@InputType()
export class MessagesFilter extends Filter<Messages>(Messages, MessagesFieldArgumentEnum) {}