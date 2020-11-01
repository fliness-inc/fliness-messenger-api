import { Injectable, ForbiddenException } from '@nestjs/common';
import MembersService from '@schema/resolvers/members/members.service';
import { InvalidPropertyError, NotFoundError } from '@src/errors';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import Message from '@database/entities/message';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptionsFunc, FindOneOptionsFunc } from '@schema/utils';

export class MessageCreateOptions {
    public readonly text: string;
}

@Injectable()
export class MessagesService {
	public constructor(
        @InjectRepository(Message)
        private readonly messageRepository: Repository<Message>,
        private readonly membersService: MembersService
	) {}
    
	public async create(userId: string, chatId: string, options: MessageCreateOptions): Promise<Message> {
		const { text } = options;

		const member = await this.membersService.findOne({ where: { userId, chatId, isDeleted: false }});

		if (!member)
			throw new NotFoundError(`The member was not found with the user id or chat id`);

		const newMessages = this.messageRepository.create({
			memberId: member.id,
			text
		});
		return this.messageRepository.save(newMessages);
	}

	public async remove(userId: string, messageId: string): Promise<Message> {
		const message = await this.findOne({ 
			where: { 
				id: messageId, 
				isDeleted: false 
			}
		});

		if (!message)
			throw new NotFoundError(`The message was not found with the id: ${messageId}`);

		const messageMember = await this.membersService.findOne({ 
			where: { 
				id: message.memberId, 
				isDeleted: false 
			} 
		});

		if (!messageMember) 
			throw new InvalidPropertyError(`The message member was not found the id: ${message.memberId}`)
        
		const member = await this.membersService.findOne({ 
			where: { 
				userId, 
				chatId: messageMember.chatId, 
				isDeleted: false 
			} 
		});

		if (!member) 
			throw new InvalidPropertyError(`The member was not found the user id: ${userId}`)

		if (member.userId !== messageMember.userId)
			throw new ForbiddenException(`You dont have permission`);

		return this.messageRepository.save(this.messageRepository.create({
			...message,
			isDeleted: true
		}));
	}

	private prepareQuery(alias: string, options: FindManyOptions<Message> = {}): FindManyOptions<Message> {
		const { join = {}, select = [] } = options; 
		return {
			...options,
			select: [
				...select,
				'id', 
				'text', 
				'memberId', 
				'createdAt',
			],
			join: {
				...join,
				alias
			}
		};
	}

	public async find(options?: FindManyOptions<Message> | FindManyOptionsFunc<Message>): Promise<Message[]> {
		const alias = 'messages';
		const op = typeof options === 'function' ? options(alias) : options;
		return this.messageRepository.find(this.prepareQuery(alias, op));
	}

	public async findOne(options?: FindOneOptions<Message> | FindOneOptionsFunc<Message>): Promise<Message | undefined> {
		const alias = 'messages';
		const op = typeof options === 'function' ? options(alias) : options;
		return this.messageRepository.findOne(this.prepareQuery(alias, op));
	}
}

export default MessagesService;