import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { Inject, forwardRef } from '@nestjs/common';
import { CurrentUser } from '@schema/models/auth/current-user';
import MessagesService from '@schema/models/messages/messages.service';
import MembersService from '@schema/models/members/members.service';
import { Chat as ChatModel } from './chats.model';

@Resolver(() => ChatModel)
export class ChatsModelResolver {
  constructor(
    @Inject(forwardRef(() => MessagesService))
    private readonly messagesService: MessagesService,
    private readonly membersService: MembersService
  ) {}

  @ResolveField(() => Number, { name: 'numUnreaded' })
  public async numUnreaded(
    @CurrentUser() user,
    @Parent() chat: ChatModel
  ): Promise<number> {
    const member = await this.membersService.findOne({
      select: ['id'],
      where: { chatId: chat.id, userId: user.id }
    });

    if (!member) throw new Error(`The member was not found`);

    return await this.messagesService.getNumberNotViewed(member.id);
  }
}

export default ChatsModelResolver;
