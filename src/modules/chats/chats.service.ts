import {
  Injectable,
  forwardRef,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatEntity } from '~/db/entities/chat.entity';
import { ChatTypeEntity } from '~/db/entities/chat-type.entity';
import { ChatTypeEnum } from '~/modules/chats/chats.dto';
import { UsersService } from '~/modules/users/users.service';
import { MembersService } from '~/modules/members/members.service';
import {
  IChat,
  CreateChatOptions,
} from '~/modules/chats/strategies/chat.interface';
import { DialogStrategy } from '~/modules/chats/strategies/dialogs';

@Injectable()
export class ChatsService {
  private readonly chatStrategies = new Map<ChatTypeEnum, IChat>();

  public constructor(
    @InjectRepository(ChatEntity)
    private readonly chatsRepository: Repository<ChatEntity>,
    @InjectRepository(ChatTypeEntity)
    private readonly chatTypesRepository: Repository<ChatTypeEntity>,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => MembersService))
    private readonly membersService: MembersService
  ) {
    this.chatStrategies.set(
      ChatTypeEnum.DIALOG,
      new DialogStrategy(
        this.chatsRepository,
        this.chatTypesRepository,
        this.membersService
      )
    );
    /* this.chatsModels.set(
      ChatTypeEnum.GROUP,
      new Group(this.chatsRepository, this.membersService)
    );
    this.chatsModels.set(
      ChatTypeEnum.CHANNEL,
      new Channel(this.chatsRepository, this.membersService)
    ); */
  }

  public async create(
    userId: string,
    type: ChatTypeEnum,
    options: CreateChatOptions = {}
  ): Promise<ChatEntity> {
    const user = await this.usersService.findOne({
      select: ['id'],
      where: { id: userId },
    });

    if (!user)
      throw new BadRequestException(
        `The user was not found with the id: ${userId}`
      );

    const resolver = this.chatStrategies.get(type);

    if (!resolver)
      throw new BadRequestException(`The resolver was not found: ${type}`);

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
      throw new NotFoundException(
        `The chat was not find with the id: ${chatId}`
      );

    const chat = await this.chatsRepository
      .createQueryBuilder('chats')
      .select('chats.id', 'id')
      .where('chats.id = :id', { id: chatId })
      .getRawOne();

    if (!chat?.id)
      throw new NotFoundException(
        `The chat was not find with the id: ${chatId}`
      );

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

  public async createChatType(name: ChatTypeEnum) {
    console.warn('Unsafe method');
    return this.chatTypesRepository.save(
      this.chatTypesRepository.create({
        name,
      })
    );
  }
}

export default ChatsService;
