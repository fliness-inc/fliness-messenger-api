import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import UUID from '@schema/types/uuid';
import Filter from '@schema/generics/filter';

@InputType()
export class MessageCreateDTO {
    @Field(() => String, { description: 'The content of your message.' })
    public readonly text: string;

    @Field(() => UUID)
    public readonly chatId: string;
}

export enum MessageFieldArgumentEnum {
    ID = '"message"."id"',
    TEXT = '"message"."text"',
    UPDATED_At = '"message"."updated_at"',
    CREATED_At = '"message"."created_at"',
    MEMBER_ID = '"member"."id"',
    MEMBER_USER_ID = '"member"."user_id"',
    MEMBER_CHAT_ID = '"member"."chat_id"'
}

registerEnumType(MessageFieldArgumentEnum, {
	name: 'MessageFieldName'
});

@InputType()
export class MessageFilter extends Filter(MessageFieldArgumentEnum, { name: 'MessageFilter' }) {}