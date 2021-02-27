import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { MemberEntity } from '~/db/entities/member.entity';
import ChatsService from '../chats/chats.service';
import MembersService from './members.service';
import { AuthGuard } from '~/modules/auth/auth.guard';

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

    return this.membersService.find({ where: { chatId: chat.id } });
  }
}

export default MembersController;
