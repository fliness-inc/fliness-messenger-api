import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDTO {
    @ApiProperty({ type: () => String, description: 'The content of your message.' })
    public readonly text: string;
}