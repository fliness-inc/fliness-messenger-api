import { Repository, getRepository } from 'typeorm';
import Chat from '@database/entities/chat';
import MembersService from '@schema/resolvers/members/members.service';
import IChat, { CreateChatOptions } from '@schema/resolvers/chats/types/chat.interface';
import { InvalidPropertyError, OperationInvalidError } from '@src/errors';
import ChatType from '@database/entities/chat-type';
import { ChatTypeEnum } from '@schema/resolvers/chats/chats.dto';
import { MemberRoleEnum } from '@schema/resolvers/members/members.dto';

export class Dialog implements IChat {
    public constructor(
        private readonly chatsRepository: Repository<Chat>,
        private readonly membersService: MembersService
    ) {}

    public async create(userId: string, { title, description, userIds = [] }: CreateChatOptions): Promise<Chat> {

        const memberIds = userIds.filter(id => id !== userId);

        if (memberIds.length !== 1)
            throw new InvalidPropertyError(`The dialog chat must contain the only one additional member`);

        const chatType = await getRepository(ChatType).findOne({ where: { name: ChatTypeEnum.DIALOG } });

        if (!chatType)
            throw new InvalidPropertyError(`The chat type was not found: Dialog`);

        const newChat = await this.chatsRepository.save(this.chatsRepository.create({
            type: chatType,
            title,
            description,
            memberLimit: 2
        }));

        await this.membersService.create(userId, newChat.id, MemberRoleEnum.CREATOR);

        for (const id of memberIds)
            await this.membersService.create(id, newChat.id, MemberRoleEnum.MEMBER);
    
        return newChat;
    }
}

export default Dialog;