import Chat from '~/db/entities/chat.entity';

export class CreateChatOptions {
  public readonly title?: string;
  public readonly description?: string;
  public readonly userIds?: string[];
}

export interface IChat {
  create(userId: string, options: CreateChatOptions): Promise<Chat>;
}

export default IChat;
