import { Inject } from '@nestjs/common';
import { Resolver, Subscription } from '@nestjs/graphql';
import ChatModel from './chats.model';
import { PubSubEngine } from 'graphql-subscriptions';
import { ChatsEvents } from './chats.dto';

@Resolver(of => ChatModel)
export class ChatsSubsResolver {
  constructor(@Inject('PUB_SUB') private pubSub: PubSubEngine) {}

  @Subscription(returns => ChatModel)
  public chatAdded() {
    return this.pubSub.asyncIterator(ChatsEvents.ADDED_EVENT);
  }
}

export default ChatsSubsResolver;
