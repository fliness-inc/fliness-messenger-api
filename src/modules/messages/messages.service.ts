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

export class MessageCreateOptions {
  public readonly text: string;
}

@Injectable()
export class MessagesService {
  public constructor(
    @InjectRepository(MessageEntity)
    public readonly messageRepository: Repository<MessageEntity>,
    private readonly membersService: MembersService
  ) {}

  public async create(
    memberId: string,
    options: MessageCreateOptions
  ): Promise<MessageEntity> {
    const { text } = options;

    const member = await this.membersService.findOne({
      select: ['id'],
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
}

export default MessagesService;
