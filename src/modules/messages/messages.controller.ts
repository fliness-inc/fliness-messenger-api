import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { MessageEntity } from '~/db/entities/message.entity';
import { CurrentUser } from '~/modules/auth/current-user';
import { ChatsService } from '~/modules/chats/chats.service';
import { MembersService } from '~/modules/members/members.service';
import { MessageCreateDTO } from './messages.dto';
import { MessagesService } from './messages.service';
import { AuthGuard } from '~/modules/auth/auth.guard';
import { TestingModuleBuilder } from '@nestjs/testing';

@AuthGuard()
@Controller()
export class MessagesController {
  public constructor(
    private readonly chatsService: ChatsService,
    private readonly membersService: MembersService,
    private readonly messagesService: MessagesService
  ) {}

  @Post('/chats/:chatId/messages')
  public async createMessage(
    @CurrentUser() user,
    @Param('chatId') chatId: string,
    @Body() payload: MessageCreateDTO
  ): Promise<MessageEntity> {
    const chat = await this.chatsService.findOne({
      select: ['id'],
      where: { id: chatId, isDeleted: false },
    });

    if (!chat) throw new NotFoundException('The chat was not found');

    const member = await this.membersService.findOne({
      select: ['id'],
      where: { userId: user.id, chatId: chat.id, isDeleted: false },
    });

    if (!member) throw new NotFoundException('The member was not found');

    return this.messagesService.create(member.id, payload);
  }

  @Get('/chats/:chatId/messages')
  public async getChatMessages(
    @CurrentUser() user,
    @Param('chatId') chatId: string
  ): Promise<MessageEntity[]> {
    const chat = await this.chatsService.findOne({
      select: ['id'],
      where: { id: chatId, isDeleted: false },
    });

    if (!chat) throw new NotFoundException('The chat was not found');

    const member = await this.membersService.findOne({
      select: ['id'],
      where: { userId: user.id, chatId: chat.id, isDeleted: false },
    });

    if (!member) throw new NotFoundException('The member was not found');

    return this.messagesService.messageRepository
      .createQueryBuilder('messages')
      .leftJoin('messages.member', 'member')
      .where('member.chatId = :chatId', { chatId: chat.id })
      .orderBy('messages.createdAt', 'DESC')
      .getMany();
  }
}

export default MessagesController;
