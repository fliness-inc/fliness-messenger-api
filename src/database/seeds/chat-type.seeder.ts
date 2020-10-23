import Faker from 'faker';
import ChatType from '@database/entities/chat-type';
import Factory from '@database/seeds/factory';
import Seeder from '@database/seeds/seeder';

export class ChatTypeFactory implements Factory<ChatType> {
    public create({ name }: Partial<ChatType> = {}) {
        const chatType = new ChatType();
        chatType.name = name || Faker.random.word();
        return chatType;
    }
}

export class ChatTypeSeeder extends Seeder<ChatType>(ChatType) {
    public constructor(factory: ChatTypeFactory) {
        super(factory);
    }
}

export default ChatTypeSeeder;
