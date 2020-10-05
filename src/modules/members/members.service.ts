import { Injectable, Inject, forwardRef } from '@nestjs/common';
import UserService from '@modules/users/users.service';
import ChatService from '@modules/chat/chat.service';
import Member from '@database/entities/member';
import { InvalidPropertyError, NotFoundError, OperationInvalidError } from '@src/errors';
import MemberPrivilege from '@database/entities/member-privilege';
import { MemberRespomse, Privilege } from '@modules/members/members.dto';
import { FindConditions, FindManyOptions, getRepository } from 'typeorm';

@Injectable()
export class MembersService {

    public constructor(
        private readonly userService: UserService,
        @Inject(forwardRef(() => ChatService))
        private readonly chatService: ChatService
    ) {}


    public async create(userId: string, chatId: string, privilege: Privilege): Promise<Member> {
        const user = await this.userService.findOne({ where: { id: userId, isDeleted: false } });

        if (!user)
            throw new InvalidPropertyError(`The user was not found with the id: ${userId}`);

        const chat = await this.chatService.findOne({ where: { id: chatId, isDeleted: false } });

        if (!chat)
            throw new NotFoundError(`The chat was not found with the id: ${chatId}`);

        const countMember = await getRepository(Member).count({
            where: {
                chatId: chat.id,
                isDeleted: false
            }
        });

        if (chat.memberLimit && countMember >= chat.memberLimit) 
            throw new OperationInvalidError(`The chat already has maximum number of members`);

        const memberPrivilege = await getRepository(MemberPrivilege).findOne({ where: { name: privilege, isDeleted: false } });

        if (!memberPrivilege)
            throw new InvalidPropertyError(`The member privilege was not found: ${privilege}`);

        const members = getRepository(Member);
        const newMember = members.create({
            userId: user.id,
            chatId: chat.id,
            privilegeId: memberPrivilege.id
        });

        return members.save(newMember);
    }

    public async remove(userId: string, chatId: string): Promise<Member> {
        const user = await this.userService.findOne({ where: { id: userId, isDeleted: false } });

        if (!user)
            throw new InvalidPropertyError(`The user was not found with the id: ${userId}`);

        const chat = await this.chatService.findOne({ where: { id: chatId, isDeleted: false } });

        if (!chat)
            throw new NotFoundError(`The chat was not found with the id: ${chatId}`);

        const members = getRepository(Member);
        const member = await members.findOne({ where: { userId, chatId, isDeleted: false } });
        
        if (!member) 
            throw new InvalidPropertyError(`The member was not found`);
        
        return members.save(members.create({
            ...member,
            isDeleted: true
        }))
    }

    public prepareEntity(entity: Member): MemberRespomse {
        const { id, userId, chatId, privilege, createdAt } = entity;

        return { 
            id,
            userId,
            chatId,
            privilege: privilege.name,
            createdAt,
        };
    }

    public prepareEntities(entites: Member[]): MemberRespomse[] {
        return entites.map(entity => this.prepareEntity(entity));
    }

    private prepareQuery(options?: FindConditions<Member>): FindManyOptions<Member> {
        return {
            select: [
                'id', 
                'userId', 
                'chatId', 
                'privilege',
                'createdAt',
            ],
            join: {
                alias: 't',
                leftJoinAndSelect: {
                    type: 't.privilege',
                }
            },
            where: options
        };
    }

    public async find(options?: FindConditions<Member>): Promise<Member[]> {
        return getRepository(Member).find(this.prepareQuery(options));
    }

    public async findOne(options?: FindConditions<Member>): Promise<Member | undefined> {
        return getRepository(Member).findOne(this.prepareQuery(options));
    }
}

export default MembersService;