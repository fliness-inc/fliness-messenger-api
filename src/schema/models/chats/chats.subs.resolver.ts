import { Inject } from '@nestjs/common';
import { Resolver, Subscription } from '@nestjs/graphql';
import ChatModel from './chats.model';
import MemberEntity from '@db/entities/member.entity';
import { ChatEvents } from './chats.dto';
import { PubSubEngine } from 'graphql-subscriptions';
import { getRepository } from 'typeorm';

@Resolver(of => ChatModel)
export class ChatsSubsResolver {
  constructor(@Inject('PUB_SUB') private pubSub: PubSubEngine) {}

  @Subscription(returns => ChatModel, {
    name: ChatEvents.CREATED_EVENT,
    filter: async (payload, vars, ctx) => {
      const { token } = ctx;
      return getRepository(MemberEntity)
        .createQueryBuilder('members')
        .leftJoin('members.user', 'user')
        .leftJoin('user.tokens', 'tokens')
        .andWhere('members.chat_id = :chatId', {
          chatId: payload[ChatEvents.CREATED_EVENT].id
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
  public chatCreated() {
    return this.pubSub.asyncIterator<ChatModel>(ChatEvents.CREATED_EVENT);
  }

  @Subscription(returns => ChatModel, { name: ChatEvents.REMOVED_EVENT })
  public chatRemoved() {
    return this.pubSub.asyncIterator<ChatModel>(ChatEvents.REMOVED_EVENT);
  }
}

export default ChatsSubsResolver;
