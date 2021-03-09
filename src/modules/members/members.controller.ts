import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { MemberEntity } from '~/db/entities/member.entity';
import ChatsService from '../chats/chats.service';
import MembersService from './members.service';
import { AuthGuard } from '~/modules/auth/auth.guard';
import { In } from 'typeorm';

export const makeFormated = (entity: MemberEntity) => ({
  id: entity.id,
  chatId: entity.chatId,
  roleId: entity.roleId,
  userId: entity.userId,
  updatedAt: entity.updatedAt,
  createdAt: entity.createdAt,
});

@AuthGuard()
@Controller()
export class MembersController {
  public constructor(
    private readonly chatsService: ChatsService,
    private readonly membersService: MembersService
  ) {}

  @Get('/chats/:chatId/members')
  public async getChatMembers(
    @Param('chatId') chatId: string
  ): Promise<MemberEntity[]> {
    const chat = await this.chatsService.findOne({
      select: ['id'],
      where: { id: chatId },
    });

    if (!chat) throw new NotFoundException(`The chat was not found`);

    return (
      await this.membersService.find({
        where: { chatId: chat.id },
      })
    ).map(member => <any>makeFormated(member));
  }

  @Get('/chats/members')
  public async getChatsMembers(
    @Query('chatIds') chatIds: string
  ): Promise<MemberEntity[]> {
    if (!chatIds)
      throw new BadRequestException(
        'Was not provided a query parameter `chatIds`'
      );

    const memberIds = chatIds.split(',');

    return (
      await this.membersService.find({
        where: { chatId: Array.isArray(memberIds) ? In(memberIds) : memberIds },
      })
    ).map(member => <any>makeFormated(member));
  }

  @Get('/chats/members/:memberId')
  public async getChatMemeber(
    @Param('memberId') memberId: string
  ): Promise<MemberEntity> {
    const member = await this.membersService.findOne({
      where: { id: memberId },
    });

    if (!member) throw new NotFoundException(`The member was not found`);

    return <any>makeFormated(member);
  }
}

export default MembersController;
