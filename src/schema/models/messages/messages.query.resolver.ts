import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { Message as MessageModel } from './messages.model';
import { MessagesService } from './messages.service';
import { CurrentUser } from '@schema/models/auth/current-user';
import MembersService from '@schema/models/members/members.service';
import { Not } from 'typeorm';

@Resolver(() => MessageModel)
export class MessagesQueryResolver {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly membersService: MembersService
  ) {}

  @ResolveField(() => Boolean, { name: 'unreaded' })
  public async unreaded(
    @CurrentUser() user,
    @Parent() message: MessageModel
  ): Promise<boolean> {
    const messageCreator = await this.membersService.findOne({
      select: ['id', 'chatId'],
      where: { id: message.memberId }
    });

    const currentMember = await this.membersService.findOne({
      where: {
        select: ['id'],
        id: Not(messageCreator.id),
        chatId: messageCreator.chatId,
        userId: user.id
      }
    });

    if (!currentMember) throw new Error(`The current member was not found`);

    return (
      (await this.messagesService.getView(message.id, currentMember.id)) ===
      undefined
    );
  }
}

export default MessagesQueryResolver;
