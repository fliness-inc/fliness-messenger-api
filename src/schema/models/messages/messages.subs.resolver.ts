import { Inject } from '@nestjs/common';
import { Resolver, Subscription, Args } from '@nestjs/graphql';
import MessageModel from '../messages/messages.model';
import MemberEntity from '@db/entities/member.entity';
import { MessageEvents } from '../messages/messages.dto';
import { PubSubEngine } from 'graphql-subscriptions';
import { getRepository } from 'typeorm';
import UUID from '@schema/types/uuid.type';

@Resolver(of => MessageModel)
export class MessagesSubsResolver {
  constructor(@Inject('PUB_SUB') private pubSub: PubSubEngine) {}

  @Subscription(returns => MessageModel, {
    name: MessageEvents.CREATED_EVENT,
    filter: async (payload, vars, ctx) => {
      const { token } = ctx;

      if (vars.chatId !== payload.chatId) return false;

      return getRepository(MemberEntity)
        .createQueryBuilder('members')
        .leftJoin('members.user', 'user')
        .leftJoin('user.tokens', 'tokens')
        .andWhere('members.chat_id = :chatId', {
          chatId: payload.chatId
        })
        .andWhere('tokens.token = :token', { token })
        .andWhere('tokens.expires_at > :expiresAt', {
          expiresAt: new Date().toISOString()
        })
        .getCount()
        .then(count => count > 0)
        .catch(e => false);
    }
  })
  public messageCreated(@Args('chatId', { type: () => UUID }) chatId: string) {
    return this.pubSub.asyncIterator<MessageModel>(MessageEvents.CREATED_EVENT);
  }

  @Subscription(returns => MessageModel, { name: MessageEvents.REMOVED_EVENT })
  public messageRemoved() {
    return this.pubSub.asyncIterator<MessageModel>(MessageEvents.REMOVED_EVENT);
  }
}

export default MessagesSubsResolver;
