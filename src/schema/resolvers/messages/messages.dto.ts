import { Field, InputType } from '@nestjs/graphql';
import UUID from '@schema/types/uuid';

@InputType()
export class MessageCreateDTO {
    @Field(type => String, { description: 'The content of your message.' })
    public readonly text: string;

    @Field(type => UUID)
    public readonly chatId: string;
}