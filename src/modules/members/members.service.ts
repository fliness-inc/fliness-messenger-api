/* import { Injectable, Inject, forwardRef } from '@nestjs/common';
import UserService from '@modules/users/users.service';
import ChatService from '@modules/chats/chats.service';
import Member from '@database/entities/member';
import { InvalidPropertyError, NotFoundError, OperationInvalidError } from '@src/errors';
import MemberRole from '@database/entities/member-role';
import { MemberResponse, MemberRoleNameEnum } from '@modules/members/members.dto';
import { FindManyOptions, FindOneOptions, getRepository } from 'typeorm';
import { FindManyOptionsFunc, FindOneOptionsFunc } from '@src/utils';

@Injectable()
export class MembersService {

    public constructor(
        private readonly userService: UserService,
        @Inject(forwardRef(() => ChatService))
        private readonly chatService: ChatService
    ) {}


    public async create(userId: string, chatId: string, roleName: MemberRoleNameEnum): Promise<Member> {
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

        const memberRole = await getRepository(MemberRole).findOne({ where: { name: roleName, isDeleted: false } });

        if (!memberRole)
            throw new InvalidPropertyError(`The member role was not found: ${roleName}`);

        const members = getRepository(Member);
        const newMember = members.create({
            userId: user.id,
            chatId: chat.id,
            roleId: memberRole.id
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

    public prepareEntity(entity: Member): MemberResponse {
        const { id, userId, chatId, role, createdAt } = entity;

        return { 
            id,
            userId,
            chatId,
            role: role.name,
            createdAt,
        };
    }

    public prepareEntities(entites: Member[]): MemberResponse[] {
        return entites.map(entity => this.prepareEntity(entity));
    }

    private prepareQuery(alias: string, options: FindManyOptions<Member> = {}): FindManyOptions<Member> {
        const { join = { leftJoinAndSelect: {} }, select = [] } = options;
        return {
            ...options,
            select: [
                ...select,
                'id', 
                'userId', 
                'chatId', 
                'role',
                'createdAt',
            ],
            join: {
                ...join,
                alias,
                leftJoinAndSelect: {
                    ...(join && join.leftJoinAndSelect ? join.leftJoinAndSelect : {}),
                    type: `${alias}.role`,
                },
            }
        };
    }

    public async find(options?: FindManyOptions<Member> | FindManyOptionsFunc<Member>): Promise<Member[]> {
        const alias = 'members';
        const op = typeof options === 'function' ? options(alias) : options;
        return getRepository(Member).find(this.prepareQuery(alias, op));
    }

    public async findOne(options?: FindOneOptions<Member> | FindOneOptionsFunc<Member>): Promise<Member | undefined> {
        const alias = 'members';
        const op = typeof options === 'function' ? options(alias) : options;
        return getRepository(Member).findOne(this.prepareQuery(alias, op));
    }
}

export default MembersService; */