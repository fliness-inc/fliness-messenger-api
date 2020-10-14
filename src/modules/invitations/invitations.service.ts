/* import { Injectable } from '@nestjs/common';
import { getRepository, FindManyOptions, FindOneOptions, FindConditions } from 'typeorm';
import UsersService from '@modules/users/users.service';
import Invitation from '@database/entities/invitation';
import InvitationType from '@database/entities/invitation-type';
import InvitationStatus from '@database/entities/invitation-status';
import { InvalidPropertyError, NotFoundError, OperationInvalidError } from '@src/errors';
import FriendsService from '@modules/friends/friends.service';
import { Type, Status } from '@modules/invitations/invitations.dto';

export class FindInvitationsOptions {
    public readonly id?: string;
    public readonly senderId?: string;
    public readonly recipientId?: string;
}

export class InvitationResponse {
    public readonly id: string;
    public readonly senderId: string;
    public readonly recipientId: string;
    public readonly status: string;
    public readonly type: string;
    public readonly expiresAt: Date;
}

@Injectable()
export class InvitationsService {

    private readonly maxAge: number = 1000 * 60 * 60 * 24 * 7; // 7 days

    public constructor(
        private readonly usersService: UsersService,
        private readonly friendsService: FriendsService
    ) {}

    public async create(senderId: string, recipientId: string, type: Type): Promise<Invitation> {
        const [sender, recipient] = await this.usersService.findByIds([ senderId, recipientId ]);

        if (!sender)
            throw new InvalidPropertyError(`The sender was not found with the id: ${senderId}`);

        if (!recipient) 
            throw new InvalidPropertyError(`The recipient was not found with the id: ${recipientId}`);

        if (sender.id === recipient.id)
            throw new InvalidPropertyError(`The sender and recipient the same user`);

        if (type === Type.INVITE_TO_FRIENDS) {
            const friend = await this.friendsService.findOne({ where: { userId: senderId, friendId: recipientId } });

            if (friend)
                throw new OperationInvalidError('The sender already has the recipient like a friend')
        }

        const invitationsType = await getRepository(InvitationType).findOne({ name: type });
        const status = await getRepository(InvitationStatus).findOne({ name: Status.WAITING });
        const invitations = getRepository(Invitation);

        return invitations.save(invitations.create({
            senderId,
            recipientId,
            status: status,
            type: invitationsType,
            expiresAt: new Date(Date.now() + this.maxAge)
        }));
    }

    private prepareQuery(options?: FindConditions<Invitation>): FindManyOptions<Invitation> {
        return {
            select: [
                'id', 
                'senderId', 
                'recipientId', 
                'typeId',
                'statusId',
                'expiresAt',
                'type',
                'status'
            ],
            join: {
                alias: 't',
                leftJoinAndSelect: {
                    type: 't.type',
                    status: 't.status'
                }
            },
            where: options
        };
    }

    public async find(options?: FindConditions<Invitation>): Promise<Invitation[]> {
        return getRepository(Invitation).find(this.prepareQuery(options));
    }

    public async findOne(options?: FindConditions<Invitation>): Promise<Invitation | undefined> {
        return getRepository(Invitation).findOne(this.prepareQuery(options));
    }

    public prepareEntity(entity: Invitation): InvitationResponse {
        const { id, senderId, recipientId, type, status, expiresAt } = entity;

        return { 
            id,
            senderId,
            recipientId,
            type: type.name,
            status: status.name,
            expiresAt,
        };
    }

    public prepareEntities(entites: Invitation[]): InvitationResponse[] {
        return entites.map(entity => this.prepareEntity(entity));
    }

    private async setStatus(id: string, status: Status): Promise<Invitation> {
        const invitation = await this.findOne({ id });

        if (!invitation)
            throw new NotFoundError(`The invitation was not found with the id: ${id}`);
        else if (invitation.status.name !== Status.WAITING)
            throw new OperationInvalidError('The invitation is not valid already');

        const newStatus = await getRepository(InvitationStatus).findOne({ name: status });

        const invitations = getRepository(Invitation);

        return invitations.save(invitations.create({
            ...invitation,
            status: newStatus,
            expiresAt: new Date()
        }));
    }

    public async accept(id: string): Promise<Invitation> {
        return this.setStatus(id, Status.ACCEPTED);
    }

    public async reject(id: string): Promise<Invitation> {
        return this.setStatus(id, Status.REJECTED);
    }

}

export default InvitationsService; */