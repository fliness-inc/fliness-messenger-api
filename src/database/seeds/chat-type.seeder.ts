import Faker from 'faker';
import { ChatType } from '@database/entities/chat-type';
import Factory from './factory';
import Seeder from './seeder';

export class ChatTypeFactory implements Factory<ChatType> {
    public create({ name }: Partial<ChatType> = {}) {
        const user = new ChatType();
        user.name = name || Faker.random.word();
        return user;
    }
}

export class ChatTypeSeeder extends Seeder<ChatType>(ChatType) {
    public constructor(factory: ChatTypeFactory) {
        super(factory);
    }
}

export default ChatTypeSeeder;
