import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Get,
  NotFoundException,
} from '@nestjs/common';
import { ChatCreateDTO } from './chats.dto';
import { CurrentUser } from '~/modules/auth/current-user';
import { ChatsService } from './chats.service';
import { AuthGuard } from '~/modules/auth/auth.guard';
import ChatEntity from '~/db/entities/chat.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import ChatTypeEntity from '~/db/entities/chat-type.entity';

@Controller()
export class ChatsController {
  public constructor(
    @InjectRepository(ChatEntity)
    private readonly chatsRepository: Repository<ChatEntity>,
    private readonly chatsService: ChatsService
  ) {}

  @AuthGuard()
  @Get('/me/chats')
  public async getChats(@CurrentUser() user): Promise<ChatEntity[]> {
    return this.chatsRepository
      .createQueryBuilder('chats')
      .leftJoin('chats.members', 'members')
      .where('members.userId = :userId', { userId: user.id })
      .getMany();
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
  public createChat(@CurrentUser() user, @Body() payload: ChatCreateDTO) {
    const { type, userIds } = payload;

    return this.chatsService.create(user.id, type, {
      userIds,
    });
  }

  @AuthGuard()
  @Delete('/chats/:chatId')
  public async deleteChat(@Param('chatId') chatId: string) {
    await this.chatsService.remove(chatId);
  }
}

export default ChatsController;
