import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Get,
  NotFoundException,
} from '@nestjs/common';
import { ChatCreateDTO, ChatTypeEnum } from './chats.dto';
import { CurrentUser } from '~/modules/auth/current-user';
import { ChatsService } from './chats.service';
import { AuthGuard } from '~/modules/auth/auth.guard';
import ChatEntity from '~/db/entities/chat.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import ChatTypeEntity from '~/db/entities/chat-type.entity';
import MembersService from '../members/members.service';
import MessagesService from '../messages/messages.service';
@Controller()
export class ChatsController {
  public constructor(
    @InjectRepository(ChatEntity)
    private readonly chatsRepository: Repository<ChatEntity>,
    private readonly chatsService: ChatsService,
    private readonly membersService: MembersService,
    private readonly messagesService: MessagesService
  ) {}

  @AuthGuard()
  @Get('/me/chats')
  public async getChats(@CurrentUser() user): Promise<ChatEntity[]> {
    const chats = await this.chatsRepository
      .createQueryBuilder('chats')
      .select('chats.id', 'id')
      .addSelect('chats.title', 'title')
      .addSelect('chats.description', 'description')
      .addSelect('chats.typeId', 'typeId')
      .addSelect('chats.updatedAt', 'updatedAt')
      .addSelect('chats.createdAt', 'createdAt')
      .leftJoin('chats.members', 'members')
      .where('members.userId = :userId', { userId: user.id })
      .getRawMany();

    const chatTypes = await this.chatsService.getChatTypes();

    for (const chat of chats) {
      const currentChatType = chatTypes.find(type => type.id === chat.typeId);

      chat.type = {
        id: currentChatType.id,
        name: currentChatType.name,
        updatedAt: currentChatType.updatedAt,
        createdAt: currentChatType.createdAt,
      };
      chat.messages = await this.messagesService.getLastMessages(chat.id);

      const member = await this.membersService.findOne({
        select: ['id'],
        where: {
          chatId: chat.id,
          userId: user.id,
        },
      });

      chat.countMessageViews = await this.messagesService.getNumberMessageViews(
        member.id
      );

      if (chat.type.name !== ChatTypeEnum.DIALOG) continue;

      chat.members = [
        await this.membersService.findOne({
          select: [
            'id',
            'roleId',
            'userId',
            'chatId',
            'updatedAt',
            'createdAt',
          ],
          where: { chatId: chat.id, userId: Not(user.id) },
        }),
      ];
    }

    return chats;
  }

  @AuthGuard()
  @Get('/me/chats/:chatId')
  public async getChat(
    @CurrentUser() user,
    @Param('chatId') chatId: string
  ): Promise<ChatEntity> {
    const chat = await this.chatsRepository
      .createQueryBuilder('chats')
      .leftJoin('chats.members', 'members')
      .where('members.userId = :userId', { userId: user.id })
      .andWhere('members.chatId = :chatId', { chatId })
      .getOne();

    if (!chat) throw new NotFoundException('The chat was not found');

    return chat;
  }

  @Get('/chats/types')
  public async getChatTypes(): Promise<ChatTypeEntity[]> {
    return this.chatsService.getChatTypes();
  }

  @AuthGuard()
  @Post('/chats')
  public async createChat(@CurrentUser() user, @Body() payload: ChatCreateDTO) {
    const { type, userIds } = payload;

    const chat = await this.chatsService.create(user.id, type, {
      userIds,
    });

    return {
      id: chat.id,
      title: chat.title,
      description: chat.description,
      typeId: chat.typeId,
      updatedAt: chat.updatedAt,
      createdAt: chat.createdAt,
    };
  }

  @AuthGuard()
  @Delete('/chats/:chatId')
  public async deleteChat(@Param('chatId') chatId: string) {
    await this.chatsService.remove(chatId);
  }
}

export default ChatsController;
