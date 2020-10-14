/* import { Injectable, ForbiddenException } from '@nestjs/common';
import MembersService from '@modules/members/members.service';
import { InvalidPropertyError, NotFoundError } from '@src/errors';
import { FindManyOptions, FindOneOptions, getRepository } from 'typeorm';
import { Message } from '@database/entities/message';
import { FindManyOptionsFunc, FindOneOptionsFunc } from '@src/utils';

export class CreateMessageOptions {
    public readonly text: string;
}

export class MessageResponse {
    public readonly id: string;
    public readonly text: string;
    public readonly memberId: string;
    public readonly createdAt: Date;
}

@Injectable()
export class MessagesService {
    public constructor(private readonly membersService: MembersService) {}
    
    public async create(userId: string, chatId: string, options: CreateMessageOptions): Promise<Message> {
        const { text } = options;

        const member = await this.membersService.findOne({ where: { userId, chatId, isDeleted: false }});

        if (!member)
            throw new InvalidPropertyError(`The member was not found with the user id or chat id`);

        const messages = getRepository(Message);
        const newMessages = messages.create({
            memberId: member.id,
            text
        });
        return messages.save(newMessages);
    }

    public async remove(userId: string, messageId: string): Promise<Message> {
        const messages = getRepository(Message);
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

        return messages.save(messages.create({
            ...message,
            isDeleted: true
        }));
    }

    public prepareEntity(entity: Message): MessageResponse {
        const { id, text, memberId, createdAt } = entity;

        return { 
            id,
            text,
            memberId,
            createdAt,
        };
    }

    public prepareEntities(entites: Message[]): MessageResponse[] {
        return entites.map(entity => this.prepareEntity(entity));
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
        return getRepository(Message).find(this.prepareQuery(alias, op));
    }

    public async findOne(options?: FindOneOptions<Message> | FindOneOptionsFunc<Message>): Promise<Message | undefined> {
        const alias = 'messages';
        const op = typeof options === 'function' ? options(alias) : options;
        return getRepository(Message).findOne(this.prepareQuery(alias, op));
    }
}

export default MessagesService; */