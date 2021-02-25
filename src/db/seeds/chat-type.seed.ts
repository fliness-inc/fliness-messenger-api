import * as faker from 'faker';
import ChatType from '~/db/entities/chat-type.entity';
import Factory from './factory';
import Seeder from './seeder';

export class ChatTypeFactory implements Factory<ChatType> {
  public create({ name }: Partial<ChatType> = {}) {
    const chatType = new ChatType();
    chatType.name = name || faker.random.word();
    return chatType;
  }
}

export class ChatTypeSeeder extends Seeder<ChatType>(ChatType) {
  public constructor(factory: ChatTypeFactory) {
    super(factory);
  }
}

export default ChatTypeSeeder;
