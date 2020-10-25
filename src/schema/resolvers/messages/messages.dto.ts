import { Field, InputType } from '@nestjs/graphql';
import UUID from '@schema/types/uuid';
import DateTime from '@schema/types/datetime';

@InputType()
export class MessageCreateDTO {
    @Field(type => String, { description: 'The content of your message.' })
    public readonly text: string;

    @Field(type => UUID)
    public readonly chatId: string;
}

@InputType()
export class MessageFilter {
    @Field(type => UUID, { 
        nullable: true,  
        description: 'The id of the message.' 
    })
    public readonly id?: string;

    @Field(type => String, { 
        nullable: true,  
        description: 'The text of the message.' 
    })
    public readonly text?: string;

    @Field(type => DateTime, { 
        nullable: true,  
        description: 'The creation time of the message.' 
    })
    public readonly createdAt?: Date;

    @Field(type => DateTime, { 
        nullable: true,  
        description: 'The last updating time of the message.' 
    })
    public readonly updatedAt?: Date;
}