import { ApiProperty } from '@nestjs/swagger';

export enum Status {
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
    WAITING = 'WAITING'
}

export enum Type {
    INVITE_TO_FRIENDS = 'INVITE_TO_FRIENDS',
    INVITE_TO_GROUP = 'INVITE_TO_GROUP',
    INVITE_TO_CHANNEL = 'INVITE_TO_CHANNEL'
}

export class FriendInvitationDTO {
    @ApiProperty({ type: () => String, description: 'The user ID to whom the friend request is being sent.' })
    public readonly userId: string;
}