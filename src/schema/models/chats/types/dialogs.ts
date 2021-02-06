import { Repository } from 'typeorm';
import ChatEntity from '@db/entities/chat.entity';
import MembersService from '@schema/models/members/members.service';
import IChat, {
  CreateChatOptions
} from '@schema/models/chats/types/chat.interface';
import { InvalidPropertyError } from '@src/errors';
import ChatTypeEntity from '@db/entities/chat-type.entity';
import { ChatTypeEnum } from '@schema/models/chats/chats.dto';
import { MemberRoleEnum } from '@schema/models/members/members.dto';

export class Dialog implements IChat {
  public constructor(
    private readonly chatsRepository: Repository<ChatEntity>,
    private readonly chatTypesRepository: Repository<ChatTypeEntity>,
    private readonly membersService: MembersService
  ) {}

  public async create(
    userId: string,
    { title, description, userIds = [] }: CreateChatOptions
  ): Promise<ChatEntity> {
    const memberIds = userIds.filter(id => id !== userId);

    if (memberIds.length !== 1)
      throw new InvalidPropertyError(
        `The dialog chat must contain the only one additional member`
      );

    const memberId = memberIds[0];

    const chatType = await this.chatTypesRepository.findOne({
      where: { name: ChatTypeEnum.DIALOG }
    });

    if (!chatType)
      throw new InvalidPropertyError(`The chat type was not found: Dialog`);

    const members = await this.membersService.membersRespository
      .createQueryBuilder('members')
      .select('COUNT(members.chat_id)', 'count')
      .leftJoin('members.chat', 'chat')
      .leftJoin('chat.type', 'type')
      .where('type.name = :typeName', { typeName: ChatTypeEnum.DIALOG })
      .andWhere('(members.user_id = :userId OR members.user_id = :memberId)', {
        userId,
        memberId
      })
      .groupBy('members.chat_id')
      .orderBy('count', 'DESC')
      .getRawOne();

    if (members?.count === '2')
      throw new InvalidPropertyError(`The dialog was already created`);

    const newChat = await this.chatsRepository.save(
      this.chatsRepository.create({
        type: chatType,
        title,
        description,
        memberLimit: 2
      })
    );

    await this.membersService.create(
      userId,
      newChat.id,
      MemberRoleEnum.CREATOR
    );

    for (const id of memberIds)
      await this.membersService.create(id, newChat.id, MemberRoleEnum.MEMBER);

    return newChat;
  }
}

export default Dialog;
