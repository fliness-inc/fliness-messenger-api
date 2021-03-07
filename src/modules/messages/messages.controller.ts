import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { MessageEntity } from '~/db/entities/message.entity';
import { CurrentUser } from '~/modules/auth/current-user';
import { ChatsService } from '~/modules/chats/chats.service';
import { MembersService } from '~/modules/members/members.service';
import { MessageCreateDTO } from './messages.dto';
import { MessagesService } from './messages.service';
import { AuthGuard } from '~/modules/auth/auth.guard';
import MessageViewEntity from '~/db/entities/message-view.entity';

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

    const message = await this.messagesService.create(member.id, payload);

    return <any>{
      id: message.id,
      text: message.text,
      memberId: message.memberId,
      updatedAt: message.updatedAt,
      createdAt: message.createdAt,
    };
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
      .select('messages.id', 'id')
      .addSelect('messages.text', 'text')
      .addSelect('messages.member_id', 'memberId')
      .addSelect('messages.updated_at', 'updatedAt')
      .addSelect('messages.created_at', 'createdAt')
      .leftJoin('messages.member', 'member')
      .where('member.chatId = :chatId', { chatId: chat.id })
      .orderBy('messages.createdAt', 'DESC')
      .getRawMany();
  }

  @Post('/chats/:chatId/messages/views')
  public async setAllMessageViews(
    @CurrentUser() user,
    @Param('chatId') chatId: string
  ): Promise<void> {
    const chat = await this.chatsService.findOne({
      select: ['id'],
      where: {
        id: chatId,
      },
    });

    if (!chat) throw new NotFoundException('The chat was not found');

    const currentUserMember = await this.membersService.findOne({
      select: ['id'],
      where: {
        userId: user.id,
        chatId: chat.id,
      },
    });

    if (!currentUserMember)
      throw new ForbiddenException('The current user is not in the chat');

    await this.messagesService.setAllMessageViews(currentUserMember.id);
  }

  @Post('/chats/messages/:messageId/views')
  public async createMessageView(
    @CurrentUser() user,
    @Param('messageId') messageId: string
  ): Promise<MessageViewEntity> {
    const message = await this.messagesService.findOne({
      select: ['id', 'memberId'],
      where: { id: messageId },
    });

    if (!message) throw new NotFoundException('The message was not found');

    const messageCreatorMember = await this.membersService.findOne({
      select: ['chatId'],
      where: {
        id: message.memberId,
      },
    });

    const currentUserMember = await this.membersService.findOne({
      select: ['id'],
      where: {
        chatId: messageCreatorMember.chatId,
        userId: user.id,
      },
    });

    if (!currentUserMember)
      throw new ForbiddenException('The current user is not in the chat');

    const view = await this.messagesService.setMessageView(
      message.id,
      currentUserMember.id
    );

    return <any>{
      id: view.id,
      memberId: view.memberId,
      messageId: view.messageId,
      updatedAt: view.updatedAt,
      createdAt: view.createdAt,
    };
  }
}

export default MessagesController;
