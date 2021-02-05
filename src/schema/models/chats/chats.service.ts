import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import Chat from '@db/entities/chat.entity';
import { ChatTypeEnum } from '@schema/models/chats/chats.dto';
import UsersService from '@schema/models/users/users.service';
import { InvalidPropertyError, NotFoundError } from '@src/errors';
import MembersService from '@schema/models/members/members.service';
import IChat, {
  CreateChatOptions
} from '@/src/schema/models/chats/types/chat.interface';
import Dialog from '@/src/schema/models/chats/types/dialogs';
import Group from '@/src/schema/models/chats/types/groups';
import Channel from '@/src/schema/models/chats/types/channel';

@Injectable()
export class ChatsService {
  private readonly chatsmodels = new Map<ChatTypeEnum, IChat>();

  public constructor(
    @InjectRepository(Chat)
    private readonly chatsRepository: Repository<Chat>,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => MembersService))
    private readonly membersService: MembersService
  ) {
    this.chatsmodels.set(
      ChatTypeEnum.DIALOG,
      new Dialog(this.chatsRepository, membersService)
    );
    this.chatsmodels.set(
      ChatTypeEnum.GROUP,
      new Group(this.chatsRepository, membersService)
    );
    this.chatsmodels.set(
      ChatTypeEnum.CHANNEL,
      new Channel(this.chatsRepository, membersService)
    );
  }

  public async create(
    userId: string,
    type: ChatTypeEnum,
    options: CreateChatOptions = {}
  ): Promise<Chat> {
    const user = await this.usersService.findOne({ where: { id: userId } });

    if (!user)
      throw new InvalidPropertyError(
        `The user was not found with the id: ${userId}`
      );

    const resolver = this.chatsmodels.get(type);

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
    const chat = await this.findOne({
      where: { id: chatId },
      join: {
        alias: 'chats',
        leftJoinAndSelect: {
          type: 'chats.type'
        }
      }
    });

    if (!chat)
      throw new NotFoundError(`The chat was not find with the id: ${chatId}`);

    return this.chatsRepository.save(
      this.chatsRepository.create({
        ...chat,
        isDeleted: true
      })
    );
  }

  public async findByIds(
    ids: string[],
    options?: FindManyOptions<Chat>
  ): Promise<Chat[]> {
    const chats = await this.chatsRepository.findByIds(ids, options);
    return ids.map(id => chats.find(u => u.id === id));
  }
}

export default ChatsService;
