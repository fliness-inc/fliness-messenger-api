import { Module } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

const pubSub = {
  provide: 'PUB_SUB',
  useValue: new PubSub()
};

@Module({
  providers: [pubSub],
  exports: [pubSub]
})
export class PubSubModule {}

export default PubSubModule;
