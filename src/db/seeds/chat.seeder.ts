import Chat from '@db/entities/chat.entity';
import Factory from '@db/seeds/factory';
import Seeder from '@db/seeds/seeder';

export class ChatFactory implements Factory<Chat> {
  public create({ title, description, typeId }: Partial<Chat> = {}) {
    const chat = new Chat();
    chat.title = title || null;
    chat.description = description || null;
    chat.typeId = typeId || null;
    return chat;
  }
}

export class ChatSeeder extends Seeder<Chat>(Chat) {
  public constructor(factory: ChatFactory) {
    super(factory);
  }
}

export default ChatSeeder;
