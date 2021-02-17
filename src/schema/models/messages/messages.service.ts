import { Injectable, ForbiddenException } from '@nestjs/common';
import MembersService from '@schema/models/members/members.service';
import { InvalidPropertyError, NotFoundError } from '@src/errors';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import MessageEntity from '@db/entities/message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptionsFunc, FindOneOptionsFunc } from '@schema/utils';
import { ViewMessage as ViewMessageEntity } from '@db/entities/views-messages.entity';

export class MessageCreateOptions {
  public readonly text: string;
}

@Injectable()
export class MessagesService {
  public constructor(
    @InjectRepository(MessageEntity)
    public readonly messageRepository: Repository<MessageEntity>,
    @InjectRepository(ViewMessageEntity)
    public readonly viewMessagesRepository: Repository<ViewMessageEntity>,
    private readonly membersService: MembersService
  ) {}

  public async create(
    memberId: string,
    options: MessageCreateOptions
  ): Promise<MessageEntity> {
    const { text } = options;

    const member = await this.membersService.findOne({
      where: { id: memberId, isDeleted: false }
    });

    if (!member)
      throw new NotFoundError(
        `The member was not found with the user id or chat id`
      );

    const message = await this.messageRepository.save(
      this.messageRepository.create({
        memberId: member.id,
        text
      })
    );

    await this.setView(message.id, member.id);

    return message;
  }

  public async remove(
    userId: string,
    messageId: string
  ): Promise<MessageEntity> {
    const message = await this.findOne({
      where: {
        id: messageId,
        isDeleted: false
      }
    });

    if (!message)
      throw new NotFoundError(
        `The message was not found with the id: ${messageId}`
      );

    const messageMember = await this.membersService.findOne({
      where: {
        id: message.memberId,
        isDeleted: false
      }
    });

    if (!messageMember)
      throw new InvalidPropertyError(
        `The message member was not found the id: ${message.memberId}`
      );

    const member = await this.membersService.findOne({
      where: {
        userId,
        chatId: messageMember.chatId,
        isDeleted: false
      }
    });

    if (!member)
      throw new InvalidPropertyError(
        `The member was not found the user id: ${userId}`
      );

    if (member.userId !== messageMember.userId)
      throw new ForbiddenException(`You dont have permission`);

    return this.messageRepository.save(
      this.messageRepository.create({
        ...message,
        isDeleted: true
      })
    );
  }

  private prepareQuery(
    alias: string,
    options: FindManyOptions<MessageEntity> = {}
  ): FindManyOptions<MessageEntity> {
    const { join = {}, select = [] } = options;
    return {
      ...options,
      select: [...select, 'id', 'text', 'memberId', 'createdAt'],
      join: {
        ...join,
        alias
      }
    };
  }

  public async find(
    options?:
      | FindManyOptions<MessageEntity>
      | FindManyOptionsFunc<MessageEntity>
  ): Promise<MessageEntity[]> {
    const alias = 'messages';
    const op = typeof options === 'function' ? options(alias) : options;
    return this.messageRepository.find(this.prepareQuery(alias, op));
  }

  public async findOne(
    options?: FindOneOptions<MessageEntity> | FindOneOptionsFunc<MessageEntity>
  ): Promise<MessageEntity | undefined> {
    const alias = 'messages';
    const op = typeof options === 'function' ? options(alias) : options;
    return this.messageRepository.findOne(this.prepareQuery(alias, op));
  }

  public async setView(
    messageId: string,
    memberId: string
  ): Promise<ViewMessageEntity> {
    const member = await this.membersService.findOne({
      where: { id: memberId }
    });

    if (!member) throw new Error('The member was not found');

    const message = await this.findOne({
      where: { id: messageId }
    });

    if (!message) throw new Error('The message was not found');

    const exitsViews = await this.viewMessagesRepository.count({
      where: {
        memberId: member.id,
        messageId: message.id
      }
    });

    if (exitsViews > 0) throw new Error('The view is already created');

    return this.viewMessagesRepository.save(
      this.viewMessagesRepository.create({
        memberId: member.id,
        messageId: message.id
      })
    );
  }

  public async getViews(memberId: string): Promise<number> {
    const member = await this.membersService.findOne({
      where: { id: memberId },
      join: {
        alias: 'members',
        leftJoin: {
          chat: 'members.chat'
        }
      }
    });

    if (!member) throw new Error('The member was not found');

    return this.messageRepository
      .createQueryBuilder('messages')
      .setParameter('memberId', member.id)
      .setParameter('chatId', member.chatId)
      .where(() => {
        const query = this.viewMessagesRepository
          .createQueryBuilder('views')
          .select('views.message_id')
          .leftJoin('views.member', 'member')
          .leftJoin('member.chat', 'chat')
          .where('member.id = :memberId')
          .andWhere('member.chat_id = :chatId')
          .getQuery();

        return `messages.id NOT IN (${query})`;
      })
      .getCount();
  }
}

export default MessagesService;
