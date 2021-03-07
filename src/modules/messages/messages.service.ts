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

export class MessageCreateOptions {
  public readonly text: string;
}

@Injectable()
export class MessagesService {
  public constructor(
    @InjectRepository(MessageEntity)
    public readonly messageRepository: Repository<MessageEntity>,
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
}

export default MessagesService;
