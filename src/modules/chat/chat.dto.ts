import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum Type {
    DIALOG = 'DIALOG',
    GROUP = 'GROUP',
    CHANNEL = 'CHANNEL'
}

export class ChatCreateDTO {
    @ApiPropertyOptional({ type: () => String, description: `
        The title of your chat. If you are creating a group/channel, this property is required.`
    })
    public readonly title?: string;

    @ApiPropertyOptional({ type: () => String, description: 'The description of your chat.' })
    public readonly description?: string;

    @ApiProperty({ enum: Type, description: 'The type of your chat.' })
    public readonly type: Type;

    @ApiPropertyOptional({ type: () => [String], description: `
        IDs of users who will be automatically added to the chat. 
        If you add the ID of the user who is the chat creator, 
        only one member will still be created. 
        If you are creating a dialog, you must specify 
        a second member.` 
    })
    public readonly userIds?: string[];
}