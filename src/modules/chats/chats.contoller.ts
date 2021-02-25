import { Body, Controller, Delete, Param, Post, Get } from '@nestjs/common';
import { ChatCreateDTO } from './chats.dto';
import { CurrentUser } from '~/modules/auth/current-user';
import { ChatsService } from './chats.service';
import { AuthGuard } from '~/modules/auth/auth.guard';
import ChatEntity from '~/db/entities/chat.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@AuthGuard()
@Controller()
export class ChatsController {
  public constructor(
    @InjectRepository(ChatEntity)
    private readonly chatsRepository: Repository<ChatEntity>,
    private readonly chatsService: ChatsService
  ) {}

  @Get('/me/chats')
  public async getChats(@CurrentUser() user): Promise<ChatEntity[]> {
    return this.chatsRepository
      .createQueryBuilder('chats')
      .leftJoin('chats.members', 'members')
      .where('members.userId = :userId', { userId: user.id })
      .getMany();
  }

  @Post('/chats')
  public createChat(@CurrentUser() user, @Body() payload: ChatCreateDTO) {
    const { type, userIds } = payload;

    return this.chatsService.create(user.id, type, {
      userIds,
    });
  }

  @Delete('/chats/:chatId')
  public async deleteChat(@Param('chatId') chatId: string) {
    await this.chatsService.remove(chatId);
  }
}

export default ChatsController;
