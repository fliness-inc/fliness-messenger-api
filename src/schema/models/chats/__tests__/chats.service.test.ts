import { Test } from '@nestjs/testing';
import facker from 'faker';
import { ChatsService } from '@schema/models/chats/chats.service';
import { UsersService } from '@schema/models/users/users.service';
import { MembersService } from '@schema/models/members/members.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Chat as ChatEntity } from '@db/entities/chat.entity';
import { ChatType as ChatTypeEntity } from '@db/entities/chat-type.entity';
import { User as UserEntity } from '@db/entities/user.entity';
import { Member as MemberEntity } from '@db/entities/member.entity';
import { ChatTypeEnum } from '../chats.dto';
import { Repository } from 'typeorm';

describe('[Chats Module] ...', () => {
  let chatsService: ChatsService;
  let usersService: UsersService;
  let membersService: MembersService;
  let chatsRepository: Repository<ChatEntity>;
  let chatTypesRepository: Repository<ChatTypeEntity>;

  const mockMembersRespository = {
    select: () => mockMembersRespository,
    leftJoin: () => mockMembersRespository,
    where: () => mockMembersRespository,
    andWhere: () => mockMembersRespository,
    groupBy: () => mockMembersRespository,
    orderBy: () => mockMembersRespository,
    getRawOne: (): any => {}
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ChatsService,
        UsersService,
        MembersService,
        {
          provide: getRepositoryToken(ChatEntity),
          useFactory: () => ({
            save: () => {},
            create: () => {},
            find: () => {},
            findOne: () => {},
            findByIds: () => {}
          })
        },
        {
          provide: getRepositoryToken(ChatTypeEntity),
          useFactory: () => ({
            findOne: () => {}
          })
        }
      ]
    })
      .overrideProvider(UsersService)
      .useFactory({
        factory: () => ({
          findOne: () => {}
        })
      })
      .overrideProvider(MembersService)
      .useFactory({
        factory: () => ({
          create: () => {},
          membersRespository: {
            createQueryBuilder: () => mockMembersRespository
          }
        })
      })
      .compile();

    chatsService = moduleRef.get<ChatsService>(ChatsService);
    usersService = moduleRef.get<UsersService>(UsersService);
    membersService = moduleRef.get<MembersService>(MembersService);
    chatsRepository = moduleRef.get<Repository<ChatEntity>>(
      getRepositoryToken(ChatEntity)
    );
    chatTypesRepository = moduleRef.get<Repository<ChatTypeEntity>>(
      getRepositoryToken(ChatTypeEntity)
    );
  });

  describe('[Chats Service]', () => {
    it('should be correct initialized service', () => {
      expect(chatsService.chatsModels.size === 3).toBeTruthy();
    });

    describe('[Dialogs]', () => {
      it('should create a dialog', async () => {
        const user = new UserEntity();
        user.id = facker.random.uuid();
        user.name = facker.internet.userName();
        user.email = facker.internet.email();
        user.password = facker.internet.password();

        const chatType = new ChatTypeEntity();
        chatType.id = facker.random.uuid();
        chatType.name = ChatTypeEnum.DIALOG;

        const chat = new ChatEntity();
        chat.id = facker.random.uuid();
        chat.type = chatType;
        chat.typeId = chatType.id;
        chat.memberLimit = 2;

        const findOneUserFunc = jest.spyOn(usersService, 'findOne');
        findOneUserFunc.mockResolvedValueOnce(user);

        const findChatTypeFunc = jest.spyOn(chatTypesRepository, 'findOne');
        findChatTypeFunc.mockResolvedValueOnce(chatType);

        const saveChatFunc = jest.spyOn(chatsRepository, 'save');
        saveChatFunc.mockResolvedValueOnce(chat);

        const createMemberFunc = jest.spyOn(membersService, 'create');
        createMemberFunc.mockResolvedValueOnce(new MemberEntity());
        createMemberFunc.mockResolvedValueOnce(new MemberEntity());

        const createChatFunc = jest.spyOn(chatsRepository, 'create');
        createChatFunc.mockReturnValueOnce(chat);

        expect(
          await chatsService.create(user.id, ChatTypeEnum.DIALOG, {
            userIds: [facker.random.uuid()]
          })
        ).toStrictEqual(chat);

        expect(findOneUserFunc).toBeCalledTimes(1);
        expect(findOneUserFunc).toBeCalledWith({ where: { id: user.id } });

        expect(findChatTypeFunc).toBeCalledTimes(1);
        expect(findChatTypeFunc).toBeCalledWith({
          where: { name: ChatTypeEnum.DIALOG }
        });

        expect(saveChatFunc).toBeCalledTimes(1);
        expect(saveChatFunc).toBeCalledWith(chat);

        expect(createMemberFunc).toBeCalledTimes(2);
      });

      it('should throw an error when creator was not found', async () => {
        const user = new UserEntity();
        user.id = facker.random.uuid();
        user.name = facker.internet.userName();
        user.email = facker.internet.email();
        user.password = facker.internet.password();

        const findOneUserFunc = jest.spyOn(usersService, 'findOne');
        findOneUserFunc.mockResolvedValueOnce(undefined);

        expect(
          chatsService.create(user.id, ChatTypeEnum.DIALOG, {
            userIds: [facker.random.uuid()]
          })
        ).rejects.toEqual(
          new Error(`The user was not found with the id: ${user.id}`)
        );
      });

      it('should throw an error when a chat type was not found (in set chat models)', () => {
        const user = new UserEntity();
        user.id = facker.random.uuid();
        user.name = facker.internet.userName();
        user.email = facker.internet.email();
        user.password = facker.internet.password();

        const findOneUserFunc = jest.spyOn(usersService, 'findOne');
        findOneUserFunc.mockResolvedValueOnce(user);

        const fackChatType = facker.random.word();

        expect(
          chatsService.create(user.id, <any>fackChatType, {
            userIds: [facker.random.uuid()]
          })
        ).rejects.toEqual(
          new Error(`The chat type was not found: ${fackChatType}`)
        );
      });

      it('should throw an error when a member was not provided', () => {
        const user = new UserEntity();
        user.id = facker.random.uuid();
        user.name = facker.internet.userName();
        user.email = facker.internet.email();
        user.password = facker.internet.password();

        const findOneUserFunc = jest.spyOn(usersService, 'findOne');
        findOneUserFunc.mockResolvedValueOnce(user);

        expect(
          chatsService.create(user.id, ChatTypeEnum.DIALOG)
        ).rejects.toEqual(
          new Error(
            `The dialog chat must contain the only one additional member`
          )
        );
      });

      it('should throw an error when was provided creator as member', () => {
        const user = new UserEntity();
        user.id = facker.random.uuid();
        user.name = facker.internet.userName();
        user.email = facker.internet.email();
        user.password = facker.internet.password();

        const findOneUserFunc = jest.spyOn(usersService, 'findOne');
        findOneUserFunc.mockResolvedValueOnce(user);

        expect(
          chatsService.create(user.id, ChatTypeEnum.DIALOG, {
            userIds: [user.id]
          })
        ).rejects.toEqual(
          new Error(
            `The dialog chat must contain the only one additional member`
          )
        );
      });

      it('should throw an error when a chat type was not found (in database)', () => {
        const user = new UserEntity();
        user.id = facker.random.uuid();
        user.name = facker.internet.userName();
        user.email = facker.internet.email();
        user.password = facker.internet.password();

        const findOneUserFunc = jest.spyOn(usersService, 'findOne');
        findOneUserFunc.mockResolvedValueOnce(user);

        const findChatTypeFunc = jest.spyOn(chatTypesRepository, 'findOne');
        findChatTypeFunc.mockResolvedValueOnce(undefined);

        expect(
          chatsService.create(user.id, ChatTypeEnum.DIALOG, {
            userIds: [facker.random.uuid()]
          })
        ).rejects.toEqual(new Error(`The chat type was not found: Dialog`));
      });

      it('should throw an error when a chat was already created', () => {
        const user = new UserEntity();
        user.id = facker.random.uuid();
        user.name = facker.internet.userName();
        user.email = facker.internet.email();
        user.password = facker.internet.password();

        const chatType = new ChatTypeEntity();
        chatType.id = facker.random.uuid();
        chatType.name = ChatTypeEnum.DIALOG;

        const chat = new ChatEntity();
        chat.id = facker.random.uuid();
        chat.type = chatType;
        chat.typeId = chatType.id;
        chat.memberLimit = 2;

        const findOneUserFunc = jest.spyOn(usersService, 'findOne');
        findOneUserFunc.mockResolvedValueOnce(user);

        const findChatTypeFunc = jest.spyOn(chatTypesRepository, 'findOne');
        findChatTypeFunc.mockResolvedValueOnce(chatType);

        jest
          .spyOn(mockMembersRespository, 'getRawOne')
          .mockResolvedValueOnce({ count: '2' });

        expect(
          chatsService.create(user.id, ChatTypeEnum.DIALOG, {
            userIds: [facker.random.uuid()]
          })
        ).rejects.toEqual(new Error(`The dialog was already created`));
      });
    });

    it('should return a chats', async () => {
      const chats = [];
      for (let i = 0; i < 10; i++) {
        const chat = new ChatEntity();
        chat.id = facker.random.uuid();
        chats.push(chat);
      }

      const params = { where: { id: chats[0].id } };

      const findChatsFunc = jest.spyOn(chatsRepository, 'find');
      findChatsFunc.mockResolvedValueOnce(chats);

      expect(await chatsService.find(params)).toStrictEqual(chats);

      expect(findChatsFunc).toBeCalledTimes(1);
      expect(findChatsFunc).toBeCalledWith(params);
    });

    it('should return a chat', async () => {
      const chat = new ChatEntity();
      chat.id = facker.random.uuid();

      const params = { where: { id: chat.id } };

      const findOneChatsFunc = jest.spyOn(chatsRepository, 'findOne');
      findOneChatsFunc.mockResolvedValueOnce(chat);

      expect(await chatsService.findOne(params)).toStrictEqual(chat);

      expect(findOneChatsFunc).toBeCalledTimes(1);
      expect(findOneChatsFunc).toBeCalledWith(params);
    });

    it('should remove a chat', async () => {
      const chat = new ChatEntity();
      chat.id = facker.random.uuid();

      const findOneChatsFunc = jest.spyOn(chatsService, 'findOne');
      findOneChatsFunc.mockResolvedValueOnce(chat);

      const createChatFunc = jest.spyOn(chatsRepository, 'create');
      createChatFunc.mockReturnValueOnce({ ...chat, isDeleted: true });

      const saveChatFunc = jest.spyOn(chatsRepository, 'save');
      saveChatFunc.mockResolvedValueOnce({ ...chat, isDeleted: true });

      expect(await chatsService.remove(chat.id)).toStrictEqual({
        ...chat,
        isDeleted: true
      });

      expect(findOneChatsFunc).toBeCalledTimes(1);
      expect(findOneChatsFunc).toBeCalledWith({ where: { id: chat.id } });

      expect(createChatFunc).toBeCalledTimes(1);
      expect(createChatFunc).toBeCalledWith({ ...chat, isDeleted: true });

      expect(saveChatFunc).toBeCalledTimes(1);
      expect(saveChatFunc).toBeCalledWith({ ...chat, isDeleted: true });
    });

    it('should throw an error while trying to remove a chat that is not exists', async () => {
      const findOneChatsFunc = jest.spyOn(chatsService, 'findOne');
      findOneChatsFunc.mockResolvedValueOnce(undefined);

      expect(chatsService.remove(undefined)).rejects.toEqual(
        new Error(`The chat was not find with the id: ${undefined}`)
      );

      expect(findOneChatsFunc).toBeCalledTimes(1);
      expect(findOneChatsFunc).toBeCalledWith({ where: { id: undefined } });
    });

    it('should find chats by ids', async () => {
      const chats = [];
      for (let i = 0; i < 10; i++) {
        const chat = new ChatEntity();
        chat.id = facker.random.uuid();
        chats.push(chat);
      }

      const findChatByIdsFunc = jest.spyOn(chatsRepository, 'findByIds');
      findChatByIdsFunc.mockResolvedValueOnce(chats);

      expect(await chatsService.findByIds(chats.map(c => c.id))).toStrictEqual(
        chats
      );
    });

    it('should return an empty array of chats while trying to find them by incorrect ids', async () => {
      const chats = [];
      for (let i = 0; i < 10; i++) {
        const chat = new ChatEntity();
        chat.id = facker.random.uuid();
        chats.push(chat);
      }

      const findChatByIdsFunc = jest.spyOn(chatsRepository, 'findByIds');
      findChatByIdsFunc.mockResolvedValueOnce([]);

      expect(await chatsService.findByIds(chats.map(c => c.id))).toStrictEqual(
        chats.map(() => undefined)
      );
    });
  });
});
