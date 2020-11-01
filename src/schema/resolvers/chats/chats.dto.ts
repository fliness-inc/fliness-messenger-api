import { Field, InputType } from '@nestjs/graphql';
import UUID from '@schema/types/uuid';

export enum ChatTypeEnum {
    DIALOG = 'DIALOG',
    GROUP = 'GROUP',
    CHANNEL = 'CHANNEL'
}

@InputType()
export class ChatCreateDTO {
    @Field(() => String, { 
    	nullable: true,  
    	description: 'The title of your chat. If you are creating a group/channel, this property is required.' 
    })
    public readonly title?: string;

    @Field(() => String, { 
    	nullable: true, 
    	description: 'The description of your chat.' 
    })
    public readonly description?: string;

    @Field(() => ChatTypeEnum, { 
    	description: 'The type of your chat.' 
    })
    public readonly type: ChatTypeEnum;

    @Field(() => [String], { 
    	description: `IDs of users who will be automatically added to the chat. 
            If you add the ID of the user who is the chat creator, 
            only one member will still be created. 
            If you are creating a dialog, you must specify 
            a second member.`
    })
    public readonly userIds?: string[];
}

@InputType()
export class ChatsFilter {
    @Field(() => UUID, { 
    	nullable: true,  
    	description: 'The id of the chat.' 
    })
    public readonly id: string;

    @Field(() => ChatTypeEnum, { 
    	nullable: true,  
    	description: 'The type of the chat.' 
    })
    public readonly type: ChatTypeEnum;
}