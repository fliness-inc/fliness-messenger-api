import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import Chat from '@database/entities/chat';
import { ChatTypeEnum } from '@schema/resolvers/chats/chats.dto';
import UsersService from '@schema/resolvers/users/users.service';
import { InvalidPropertyError, NotFoundError } from '@src/errors';
import MembersService from '@schema/resolvers/members/members.service';
import IChat, { CreateChatOptions } from '@schema/resolvers/chats/types/chat.interface';
import Dialog from '@schema/resolvers/chats/types/dialogs';
import Group from '@schema/resolvers/chats/types/groups';
import Channel from '@schema/resolvers/chats/types/channel';

@Injectable()
export class ChatsService {

    private readonly chatsResolvers = new Map<ChatTypeEnum, IChat>();

    public constructor(
        @InjectRepository(Chat)
        private readonly chatsRepository: Repository<Chat>,
        private readonly usersService: UsersService,
        @Inject(forwardRef(() => MembersService))
        private readonly membersService: MembersService
    ) {
    	this.chatsResolvers.set(ChatTypeEnum.DIALOG, new Dialog(this.chatsRepository, membersService));
    	this.chatsResolvers.set(ChatTypeEnum.GROUP, new Group(this.chatsRepository, membersService));
    	this.chatsResolvers.set(ChatTypeEnum.CHANNEL, new Channel(this.chatsRepository, membersService));
    }

    public async create(userId: string, type: ChatTypeEnum, options: CreateChatOptions = {}): Promise<Chat> {
    	const user = await this.usersService.findOne({ where: { id: userId } });

    	if (!user)
    		throw new InvalidPropertyError(`The user was not found with the id: ${userId}`);

    	const resolver = this.chatsResolvers.get(type);

    	if (!resolver)
    		throw new InvalidPropertyError(`The chat type was not found: ${type}`);

    	return resolver.create(userId, options);
    }

    public async find(options?: FindManyOptions<Chat>): Promise<Chat[]> {
    	return this.chatsRepository.find(options);
    }

    public async findOne(options?: FindOneOptions<Chat>): Promise<Chat> {
    	return this.chatsRepository.findOne(options);
    }

    public async remove(chatId: string): Promise<Chat> {
    	const chat = await this.findOne({ where: { id: chatId } });
        
    	if (!chat)
    		throw new NotFoundError(`The chat was not find with the id: ${chatId}`);

    	return this.chatsRepository.save(this.chatsRepository.create({
    		...chat,
    		isDeleted: true
    	}));
    }

    public async findByIds(ids: string[], options?: FindManyOptions<Chat>): Promise<Chat[]> {
    	const chats = await this.chatsRepository.findByIds(ids, options);
    	return ids.map(id => chats.find(u => u.id === id));
    } 

} 

export default ChatsService;