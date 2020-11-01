import Message from '@database/entities/message';
import Factory from '@database/seeds/factory';
import Seeder from '@database/seeds/seeder';

export class MessageFactory implements Factory<Message> {
	public create({ memberId, text }: Partial<Message> = {}) {
		const message = new Message();
		message.text = text;
		message.memberId = memberId;
		return message;
	}
}

export class MessageSeeder extends Seeder<Message>(Message) {
	public constructor(factory: MessageFactory) {
		super(factory);
	}
}

export default MessageSeeder;
