/* import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { FindManyOptions, FindOneOptions, getRepository } from 'typeorm';
import Chat from '@database/entities/chat';
import ChatType from '@database/entities/chat-type';
import { ChatTypeEnum } from '@modules/chats/chats.dto';
import UsersService from '@modules/users/users.service';
import { InvalidPropertyError, NotFoundError, OperationInvalidError } from '@src/errors';
import { MembersService } from '@modules/members/members.service';
import { MemberRoleNameEnum } from '@modules/members/members.dto';

export class ChatResponse {
    public readonly id: string;
    public readonly title?: string;
    public readonly description?: string;
    public readonly type: string;
    public readonly createdAt: Date;
}

export class ChatCreateOptions {
    public readonly title?: string;
    public readonly description?: string;
    public readonly userIds?: string[];
}

@Injectable()
export class ChatsService {

    public constructor(
        private readonly usersService: UsersService,
        @Inject(forwardRef(() => MembersService))
        private readonly membersService: MembersService
    ) {}

    public async create(userId: string, type: ChatTypeEnum, options: ChatCreateOptions = {}): Promise<Chat> {
        const user = await this.usersService.findOne({ where: { id: userId } });
        const { title, description, userIds } = options;

        if (!user)
            throw new InvalidPropertyError(`The user was not found with the id: ${userId}`);

        const chatType = await getRepository(ChatType).findOne({ where: { name: type } });

        if (!chatType)
            throw new InvalidPropertyError(`The chat type was not found: ${type}`);

        const memberIds = userIds && Array.isArray(userIds) ? userIds.filter(id => id !== userId) : [];

        if (type === ChatTypeEnum.DIALOG && !memberIds.length)
            throw new InvalidPropertyError(`The type chat is ${type} and so the userIds must contain the id of the second user`);

        const memberLimit: number | null = type === ChatTypeEnum.DIALOG ? 2 : null;
        
        if (memberLimit && memberIds.length > memberLimit - 1) // minus one - the creator
            throw new OperationInvalidError(`The chat already has maximum number of members`);

        const chats = getRepository(Chat);
        const newChat = await chats.save(chats.create({
            type: chatType,
            title,
            description,
            memberLimit
        }));

        await this.membersService.create(userId, newChat.id, MemberRoleNameEnum.CREATOR);

        for (const id of memberIds)
            await this.membersService.create(id, newChat.id, MemberRoleNameEnum.MEMBER);

        return newChat;
    }

    public async find(options?: FindManyOptions<Chat>): Promise<Chat[]> {
        return getRepository(Chat).find(options);
    }

    public async findOne(options?: FindOneOptions<Chat>): Promise<Chat> {
        return getRepository(Chat).findOne(options);
    }

    public prepareEntity(entity: Chat): ChatResponse {
        const { id, title, description, type, createdAt } = entity;

        return { 
            id,
            title,
            description,
            type: type.name,
            createdAt,
        };
    }

    public prepareEntities(entites: Chat[]): ChatResponse[] {
        return entites.map(entity => this.prepareEntity(entity));
    }

    public async remove(chatId: string): Promise<Chat> {
        const chat = await this.findOne({ where: { id: chatId } });
        
        if (!chat)
            throw new NotFoundError(`The chat was not find with the id: ${chatId}`);

        const chats = getRepository(Chat);

        return chats.save(chats.create({
            ...chat,
            isDeleted: true
        }));
    }

} 

export default ChatsService; */