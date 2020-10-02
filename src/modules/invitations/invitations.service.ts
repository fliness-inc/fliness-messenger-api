import { Injectable } from '@nestjs/common';
import { getRepository } from 'typeorm';
import UsersService from '@modules/users/users.service';
import Invitation from '@database/entities/invitation';
import InvitationType from '@database/entities/invitation-type';
import InvitationStatus from '@database/entities/invitation-status';
import { InvalidPropertyError } from '@src/errors';

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

export class FindInvitationsOptions {
    public senderId?: string;
    public recipientId?: string;
}

@Injectable()
export class InvitationsService {

    private readonly maxAge: number = 1000 * 60 * 60 * 24 * 7; // 7 days

    public constructor(private readonly usersService: UsersService) {}

    public async create(senderId: string, recipientId: string, type: Type): Promise<Invitation> {
        const [sender, recipient] = await this.usersService.findByIds([ senderId, recipientId ]);

        if (!sender)
            throw new InvalidPropertyError(`The sender was not found with the id: ${senderId}`);

        if (!recipient) 
            throw new InvalidPropertyError(`The recipient was not found with the id: ${recipientId}`);

        if (sender.id === recipient.id)
            throw new InvalidPropertyError(`The sender and recipient the same user`);

        const invitationsType = await getRepository(InvitationType).findOne({ name: type });
        const status = await getRepository(InvitationStatus).findOne({ name: Status.WAITING });
        const invitations = getRepository(Invitation);

        return invitations.save(invitations.create({
            senderId,
            recipientId,
            statusId: status.id,
            typeId: invitationsType.id,
            expiresAt: new Date(Date.now() + this.maxAge)
        }));
    }

    public async find({ senderId, recipientId }: FindInvitationsOptions = {}): Promise<Invitation[]> {

        const query = getRepository(Invitation).createQueryBuilder('t')
            .select('t.id', 'id')
            .addSelect('t.sender_id', 'senderId')
            .addSelect('t.recipient_id', 'recipientId')
            .addSelect('t.expires_at', 'expiresAt')
            .addSelect('types.name', 'type')
            .addSelect('statuses.name', 'status')
            .leftJoin('t.type', 'types')
            .leftJoin('t.status', 'statuses');

        if (senderId)
            query.andWhere('t.sender_id = :senderId', { senderId: senderId });

        if (recipientId)
            query.andWhere('t.recipient_id = :recipientId', { recipientId });

        return query.getRawMany();
    } 

}

export default InvitationsService;