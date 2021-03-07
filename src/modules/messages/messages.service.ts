import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { MembersService } from '~/modules/members/members.service';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { MessageEntity } from '~/db/entities/message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import MessagesGateway from './messages.gateway';
import { MessageViewEntity } from '~/db/entities/message-view.entity';

export class MessageCreateOptions {
  public readonly text: string;
}

@Injectable()
export class MessagesService {
  public constructor(
    @InjectRepository(MessageEntity)
    public readonly messageRepository: Repository<MessageEntity>,
    @InjectRepository(MessageViewEntity)
    public readonly messageViewsRepository: Repository<MessageViewEntity>,
    private readonly membersService: MembersService,
    private readonly messagesGatway: MessagesGateway
  ) {}

  public async create(
    memberId: string,
    options: MessageCreateOptions
  ): Promise<MessageEntity> {
    const { text } = options;

    const member = await this.membersService.findOne({
      select: ['id', 'chatId'],
      where: { id: memberId, isDeleted: false },
    });

    if (!member)
      throw new NotFoundException(
        `The member was not found with the user id or chat id`
      );

    const message = await this.messageRepository.save(
      this.messageRepository.create({
        memberId: member.id,
        text,
      })
    );

    await this.setMessageView(message.id, member.id);

    this.messagesGatway.messageCreatedEvent(member.chatId, message);

    return message;
  }

  public async remove(
    userId: string,
    messageId: string
  ): Promise<MessageEntity> {
    const message = await this.findOne({
      where: {
        id: messageId,
        isDeleted: false,
      },
    });

    if (!message)
      throw new NotFoundException(
        `The message was not found with the id: ${messageId}`
      );

    const messageMember = await this.membersService.findOne({
      where: {
        id: message.memberId,
        isDeleted: false,
      },
    });

    if (!messageMember)
      throw new BadRequestException(
        `The message member was not found the id: ${message.memberId}`
      );

    const member = await this.membersService.findOne({
      where: {
        userId,
        chatId: messageMember.chatId,
        isDeleted: false,
      },
    });

    if (!member)
      throw new BadRequestException(
        `The member was not found the user id: ${userId}`
      );

    if (member.userId !== messageMember.userId)
      throw new ForbiddenException(`You dont have permission`);

    return this.messageRepository.save(
      this.messageRepository.create({
        ...message,
        isDeleted: true,
      })
    );
  }

  public async find(
    options?: FindManyOptions<MessageEntity>
  ): Promise<MessageEntity[]> {
    return this.messageRepository.find(options);
  }

  public async findOne(
    options?: FindOneOptions<MessageEntity>
  ): Promise<MessageEntity | undefined> {
    return this.messageRepository.findOne(options);
  }

  public getLastMessages(chatId: string, count = 1): Promise<MessageEntity[]> {
    return this.messageRepository
      .createQueryBuilder('messages')
      .select('messages', 'messages.id')
      .addSelect('messages', 'messages.text')
      .addSelect('messages', 'messages.memberId')
      .addSelect('messages', 'messages.updatedAt')
      .addSelect('messages', 'messages.createdAt')
      .leftJoin('messages.member', 'member')
      .where('member.chat_id = :chatId', { chatId })
      .orderBy('messages.createdAt', 'DESC')
      .limit(count)
      .getMany();
  }

  public async setMessageView(
    messageId: string,
    memberId: string
  ): Promise<MessageViewEntity> {
    const member = await this.membersService.findOne({
      select: ['id'],
      where: { id: memberId },
    });

    if (!member) throw new NotFoundException('The member was not found');

    const message = await this.findOne({
      where: { id: messageId },
    });

    if (!message) throw new NotFoundException('The message was not found');

    const exitsViews = await this.messageViewsRepository.count({
      where: {
        memberId: member.id,
        messageId: message.id,
      },
    });

    if (exitsViews > 0)
      throw new BadRequestException('The view is already created');

    return this.messageViewsRepository.save(
      this.messageViewsRepository.create({
        memberId: member.id,
        messageId: message.id,
      })
    );
  }

  public async getMessageView(
    messageId: string,
    memberId: string
  ): Promise<MessageViewEntity> {
    const member = await this.membersService.findOne({
      select: ['id'],
      where: { id: memberId },
    });

    if (!member) throw new NotFoundException('The member was not found');

    const message = await this.findOne({
      select: ['id'],
      where: { id: messageId },
    });

    if (!message) throw new NotFoundException('The message was not found');

    const messageView = await this.messageViewsRepository.findOne({
      where: {
        memberId: member.id,
        messageId: message.id,
      },
    });

    if (!messageView)
      throw new NotFoundException('The message view was not found');

    return messageView;
  }

  public async setAllMessageViews(memberId: string): Promise<void> {
    const member = await this.membersService.findOne({
      select: ['id', 'chatId'],
      where: { id: memberId },
      join: {
        alias: 'members',
        leftJoin: {
          chat: 'members.chat',
        },
      },
    });

    if (!member) throw new NotFoundException('The member was not found');

    const unreadedMessages = await this.messageRepository
      .createQueryBuilder('messages')
      .select('messages.id', 'id')
      .setParameter('memberId', member.id)
      .setParameter('chatId', member.chatId)
      .where(() => {
        const query = this.messageViewsRepository
          .createQueryBuilder('views')
          .select('views.message_id')
          .leftJoin('views.member', 'member')
          .leftJoin('member.chat', 'chat')
          .where('member.id = :memberId')
          .andWhere('member.chat_id = :chatId')
          .getQuery();

        return `messages.id NOT IN (${query})`;
      })
      .getRawMany();

    await this.messageViewsRepository
      .createQueryBuilder('views')
      .insert()
      .into(MessageViewEntity)
      .values(
        unreadedMessages.map(m => ({
          memberId: member.id,
          messageId: m.id,
        }))
      )
      .execute();
  }

  public async getNumberMessageViews(memberId: string): Promise<number> {
    const member = await this.membersService.findOne({
      select: ['id', 'chatId'],
      where: { id: memberId },
      join: {
        alias: 'members',
        leftJoin: {
          chat: 'members.chat',
        },
      },
    });

    if (!member) throw new NotFoundException('The member was not found');

    return this.messageRepository
      .createQueryBuilder('messages')
      .setParameter('memberId', member.id)
      .setParameter('chatId', member.chatId)
      .where(() => {
        const query = this.messageViewsRepository
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
