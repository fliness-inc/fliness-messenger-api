import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import Message from '@schema/models/messages.model';

@ObjectType()
export class MessagesMutation {
    @Field(type => Message)
    public readonly create: Message;

    @Field(type => Message) 
    public readonly remove: Message;
}

export default MessagesMutation;