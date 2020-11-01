import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import Entity from '@schema/models/entity';
import { ChatTypeEnum } from '@schema/resolvers/chats/chats.dto';
import DateTime from '@schema/types/datetime';

registerEnumType(ChatTypeEnum, {
	name: 'ChatType'
})

@ObjectType()
export class Chat extends Entity {
    @Field({ nullable: true })
    public readonly title?: string;

    @Field({ nullable: true })
    public readonly description?: string;

    @Field(() => ChatTypeEnum)
    public readonly type: ChatTypeEnum;

    @Field(() => DateTime)
    public readonly createdAt: Date;
}

export default Chat;