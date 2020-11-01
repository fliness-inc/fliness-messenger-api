import { ObjectType, Field } from '@nestjs/graphql';
import Chat from '@schema/models/chats.model';
import MessagesMutation from '@schema/models/messages.mutation';

@ObjectType()
export class ChatsMutation {
    @Field(() => Chat)
    public readonly create: Chat;

    @Field(() => Chat)
    public readonly remove: Chat;

    @Field(() => MessagesMutation)
    public readonly messages: MessagesMutation;
}

export default ChatsMutation;