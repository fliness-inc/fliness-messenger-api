import { Field, InputType } from '@nestjs/graphql';

export enum ChatTypeEnum {
    DIALOG = 'DIALOG',
    GROUP = 'GROUP',
    CHANNEL = 'CHANNEL'
}

@InputType()
export class ChatCreateDTO {
    @Field({ nullable: true,  description: 'The title of your chat. If you are creating a group/channel, this property is required.' })
    public readonly title?: string;

    @Field({ nullable: true, description: 'The description of your chat.' })
    public readonly description?: string;

    @Field(type => ChatTypeEnum, { description: 'The type of your chat.' })
    public readonly type: ChatTypeEnum;

    @Field(type => [String], { description: `
        IDs of users who will be automatically added to the chat. 
        If you add the ID of the user who is the chat creator, 
        only one member will still be created. 
        If you are creating a dialog, you must specify 
        a second member.`
    })
    public readonly userIds?: string[];
}

@InputType()
export class ChatsFilter {
    @Field({ nullable: true,  description: 'The type of the chat.' })
    public readonly type: ChatTypeEnum;
}