import { Test, TestingModule } from '@nestjs/testing';
import facker from 'faker';
import { MessagesService } from '@schema/models/messages/messages.service';
import { MembersService } from '@schema/models/members/members.service';
import UsersService from '@schema/models/users/users.service';
import ChatsService from '@schema/models/chats/chats.service';
import { Member as MemberEntity } from '@db/entities/member.entity';
import { ChatTypeEnum } from '@schema/models/chats/chats.dto';
import { initTestDatabase } from '@tools/test-db-connection';
import { Connection, getConnection } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message as MessageEntity } from '@db/entities/message.entity';
import { ViewMessage as ViewMessageEntity } from '@db/entities/views-messages.entity';
import { User as UserEntity } from '@db/entities/user.entity';
import { Chat as ChatEntity } from '@db/entities/chat.entity';
import { ChatType as ChatTypeEntity } from '@db/entities/chat-type.entity';

jest.setTimeout(50000);

describe('[Message Views Module] ...', () => {
  let moduleRef: TestingModule;
  let connection: Connection;
  let usersService: UsersService;
  let chatsService: ChatsService;
  let messagesService: MessagesService;
  let membersService: MembersService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(),
        TypeOrmModule.forFeature([
          MessageEntity,
          ViewMessageEntity,
          MemberEntity,
          UserEntity,
          ChatEntity,
          ChatTypeEntity
        ])
      ],
      providers: [MessagesService, MembersService, UsersService, ChatsService]
    }).compile();

    connection = getConnection();
    await connection.synchronize(true);
    await initTestDatabase();

    usersService = moduleRef.get<UsersService>(UsersService);
    chatsService = moduleRef.get<ChatsService>(ChatsService);
    messagesService = moduleRef.get<MessagesService>(MessagesService);
    membersService = moduleRef.get<MembersService>(MembersService);
  });

  beforeEach(async () => {
    await connection.query('TRUNCATE views_messages, messages CASCADE');
  });

  afterAll(async () => {
    await moduleRef.close();
    await connection.close();
  });

  describe('', () => {
    let member1: MemberEntity;
    let member2: MemberEntity;

    beforeAll(async () => {
      const user = await usersService.create({
        name: facker.internet.userName(),
        email: facker.internet.email(),
        password: facker.random.word()
      });

      const user2 = await usersService.create({
        name: facker.internet.userName(),
        email: facker.internet.email(),
        password: facker.random.word()
      });

      const chat = await chatsService.create(user.id, ChatTypeEnum.DIALOG, {
        userIds: [user2.id]
      });

      member1 = await membersService.findOne({
        where: { userId: user.id, chatId: chat.id }
      });

      member2 = await membersService.findOne({
        where: { userId: user2.id, chatId: chat.id }
      });
    });

    it('should return views without viewing messages', async () => {
      await messagesService.create(member1.id, {
        text: facker.random.words()
      });

      await messagesService.create(member2.id, {
        text: facker.random.words()
      });
      await messagesService.create(member2.id, {
        text: facker.random.words()
      });
      await messagesService.create(member2.id, {
        text: facker.random.words()
      });

      expect(await messagesService.getViews(member1.id)).toEqual(3);
    });

    it('should return views with viewing some messages', async () => {
      await messagesService.create(member1.id, {
        text: facker.random.words()
      });

      await messagesService.create(member2.id, {
        text: facker.random.words()
      });
      await messagesService.create(member2.id, {
        text: facker.random.words()
      });
      const message = await messagesService.create(member2.id, {
        text: facker.random.words()
      });

      await messagesService.setView(message.id, member1.id);

      expect(await messagesService.getViews(member1.id)).toEqual(2);
    });
  });
});
