import { ApiProperty } from '@nestjs/swagger';

export class FriendInvitationDTO {
    @ApiProperty({ type: () => String, description: 'The user ID to whom the friend request is being sent.' })
    public readonly userId: string;
}