import { Injectable, Inject, forwardRef } from '@nestjs/common';
import UsersService from '@schema/resolvers/users/users.service';
import ChatsService from '@schema/resolvers/chats/chats.service';
import Member from '@database/entities/member';
import { InvalidPropertyError, NotFoundError, OperationInvalidError } from '@src/errors';
import MemberRole from '@database/entities/member-role';
import { MemberRoleEnum } from '@schema/resolvers/members/members.dto';
import { FindManyOptions, FindOneOptions, getRepository } from 'typeorm';
import { FindManyOptionsFunc, FindOneOptionsFunc } from '@schema/utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class MembersService {

    public constructor(
        @InjectRepository(Member)
        private readonly membersRespository: Repository<Member>,
        private readonly usersService: UsersService,
        @Inject(forwardRef(() => ChatsService))
        private readonly chatsService: ChatsService
    ) {}


    public async create(userId: string, chatId: string, roleName: MemberRoleEnum): Promise<Member> {
        const user = await this.usersService.findOne({ where: { id: userId, isDeleted: false } });

        if (!user)
            throw new InvalidPropertyError(`The user was not found with the id: ${userId}`);

        const chat = await this.chatsService.findOne({ where: { id: chatId, isDeleted: false } });

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

        const newMember = this.membersRespository.create({
            userId: user.id,
            chatId: chat.id,
            role: memberRole,
        });

        return this.membersRespository.save(newMember, { reload: true });
    }

    public async remove(userId: string, chatId: string): Promise<Member> {
        const user = await this.usersService.findOne({ where: { id: userId, isDeleted: false } });

        if (!user)
            throw new InvalidPropertyError(`The user was not found with the id: ${userId}`);

        const chat = await this.chatsService.findOne({ where: { id: chatId, isDeleted: false } });

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
                'updatedAt',
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

export default MembersService;