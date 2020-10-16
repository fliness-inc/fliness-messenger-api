import { ObjectType, Field } from '@nestjs/graphql';
import Chat from '@schema/models/chats.model';
import MessagesMutation from '@schema/models/messages.mutation';

@ObjectType()
export class ChatsMutation {
    @Field(type => Chat)
    public readonly create: Chat;

    @Field(type => Chat)
    public readonly remove: Chat;

    @Field(type => MessagesMutation)
    public readonly messages: MessagesMutation;
}

export default ChatsMutation;