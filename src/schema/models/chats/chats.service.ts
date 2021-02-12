import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import ChatEntity from '@db/entities/chat.entity';
import ChatTypeEntity from '@db/entities/chat-type.entity';
import { ChatTypeEnum } from '@schema/models/chats/chats.dto';
import UsersService from '@schema/models/users/users.service';
import { InvalidPropertyError, NotFoundError } from '@src/errors';
import MembersService from '@schema/models/members/members.service';
import IChat, {
  CreateChatOptions
} from '@schema/models/chats/types/chat.interface';
import Dialog from '@schema/models/chats/types/dialogs';
import Group from '@schema/models/chats/types/groups';
import Channel from '@schema/models/chats/types/channel';

@Injectable()
export class ChatsService {
  public readonly chatsModels = new Map<ChatTypeEnum, IChat>();

  public constructor(
    @InjectRepository(ChatEntity)
    private readonly chatsRepository: Repository<ChatEntity>,
    @InjectRepository(ChatTypeEntity)
    private readonly chatTypesRepository: Repository<ChatTypeEntity>,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => MembersService))
    private readonly membersService: MembersService
  ) {
    this.chatsModels.set(
      ChatTypeEnum.DIALOG,
      new Dialog(
        this.chatsRepository,
        this.chatTypesRepository,
        this.membersService
      )
    );
    this.chatsModels.set(
      ChatTypeEnum.GROUP,
      new Group(this.chatsRepository, this.membersService)
    );
    this.chatsModels.set(
      ChatTypeEnum.CHANNEL,
      new Channel(this.chatsRepository, this.membersService)
    );
  }

  public async create(
    userId: string,
    type: ChatTypeEnum,
    options: CreateChatOptions = {}
  ): Promise<ChatEntity> {
    const user = await this.usersService.findOne({ where: { id: userId } });

    if (!user)
      throw new InvalidPropertyError(
        `The user was not found with the id: ${userId}`
      );

    const resolver = this.chatsModels.get(type);

    if (!resolver)
      throw new InvalidPropertyError(`The chat type was not found: ${type}`);

    return resolver.create(userId, options);
  }

  public async find(
    options?: FindManyOptions<ChatEntity>
  ): Promise<ChatEntity[]> {
    return this.chatsRepository.find(options);
  }

  public async findOne(
    options?: FindOneOptions<ChatEntity>
  ): Promise<ChatEntity> {
    return this.chatsRepository.findOne(options);
  }

  public async remove(chatId: string): Promise<ChatEntity> {
    if (!chatId)
      throw new NotFoundError(`The chat was not find with the id: ${chatId}`);

    const chat = await this.chatsRepository
      .createQueryBuilder('chats')
      .select('chats.id', 'id')
      .where('chats.id = :id', { id: chatId })
      .getRawOne();

    if (!chat?.id)
      throw new NotFoundError(`The chat was not find with the id: ${chatId}`);

    await this.chatsRepository
      .createQueryBuilder('chats')
      .update(ChatEntity)
      .set({ isDeleted: true })
      .where('chats.id = :id', { id: chatId })
      .execute();

    return this.chatsRepository
      .createQueryBuilder('chats')
      .leftJoinAndSelect('chats.type', 'type')
      .where('chats.id = :id', { id: chatId })
      .getOne();
  }

  public async findByIds(
    ids: string[],
    options?: FindManyOptions<ChatEntity>
  ): Promise<ChatEntity[]> {
    const chats = await this.chatsRepository.findByIds(ids, options);
    return ids.map(id => chats.find(u => u.id === id));
  }
}

export default ChatsService;
