import { ObjectType, Field } from '@nestjs/graphql';
import Chat from '@schema/models/chat.model';

@ObjectType()
export class ChatsMutation {
    @Field(type => Chat)
    public readonly create: Chat;

    @Field(type => Chat)
    public readonly remove: Chat;
}

export default ChatsMutation;