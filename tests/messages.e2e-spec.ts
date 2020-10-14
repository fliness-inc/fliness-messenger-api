/* import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { config as setupDotEnv } from 'dotenv';
import cookieParser from 'cookie-parser';
import { getConnection, Connection } from 'typeorm';
import { User } from '@database/entities/user';
import { AppModule } from '@src/app.module';
import request from 'supertest';
import * as uuid from 'uuid';
import Faker from 'faker';
import { ChatTypeEnum } from '@modules/chats/chats.dto';
import { MemberRoleNameEnum } from '@modules/members/members.dto';
import UsersService from '@modules/users/users.service';
import { Tokens } from '@modules/tokens/tokens.service';
import { ChatTypeSeeder, ChatTypeFactory } from '@database/seeds/chat-type.seeder';
import { MemberRoleSeeder, MemberRoleFactory } from '@database/seeds/member-role';
import MembersService from '@modules/members/members.service';
import Chat from '@database/entities/chat';
import ChatsService from '@modules/chats/chats.service';
import MessagesService, { MessageResponse } from '@modules/messages/messages.service';

setupDotEnv();

jest.setTimeout(50000);

describe('[E2E] [MessagesController] ...', () => {
    let app: INestApplication;
    let connection: Connection;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.use(cookieParser());
        await app.init();

        connection = getConnection();

        await connection.synchronize(true);

        const chatTypeSeeder = new ChatTypeSeeder(new ChatTypeFactory());
        await chatTypeSeeder.run(1, { name: ChatTypeEnum.DIALOG });
        await chatTypeSeeder.run(1, { name: ChatTypeEnum.GROUP });
        await chatTypeSeeder.run(1, { name: ChatTypeEnum.CHANNEL });

        const memberPriviliegeSeeder = new MemberRoleSeeder(new MemberRoleFactory());
        await memberPriviliegeSeeder.run(1, { name: MemberRoleNameEnum.CREATOR, weight: 1.0 });
        await memberPriviliegeSeeder.run(1, { name: MemberRoleNameEnum.ADMIN, weight: 0.5 });
        await memberPriviliegeSeeder.run(1, { name: MemberRoleNameEnum.MEMBER, weight: 0.1 });
    });

    afterEach(async () => {
        await connection.query('TRUNCATE messages CASCADE');
    });

    afterAll(async () => {
        await app.close();
        await connection.close();
    }); 

    describe('[Text messages] ...', () => {

        let usersService: UsersService;
        let chatsService: ChatsService;
        let membersService: MembersService;
        let messagesService: MessagesService;

        const users: { user: User, tokens: Tokens }[] = [];
        let dialog: Chat;
    
        beforeAll(async () => {
            usersService = app.get<UsersService>(UsersService);
            chatsService = app.get<ChatsService>(ChatsService);
            membersService = app.get<MembersService>(MembersService);
            messagesService =app.get<MessagesService>(MessagesService);

            for (let i = 0; i < 3; ++i) {
                const payload = { 
                    email: Faker.internet.email(),
                    password: Faker.random.word()
                };
                const user = await usersService.create({ 
                    name: Faker.internet.userName(),
                    ...payload
                });
                const res = await request(app.getHttpServer())
                    .post('/auth/login')
                    .send(payload);

                users.push({ 
                    user,
                    tokens: res.body
                });
            }

            dialog =  await chatsService.create(
                users[0].user.id, 
                ChatTypeEnum.DIALOG, 
                { userIds: [users[1].user.id] }
            );
        });

        describe('[Creating] ...', () => {
            it('should create the message', async () => {
                const [user1, user2] = users;
                const payload = { text: 'Hi' };

                const res = await request(app.getHttpServer())
                    .post(`/me/chats/${dialog.id}/messages`)
                    .set('Authorization', `Bearer ${user1.tokens.accessToken}`)
                    .send(payload);

                const member = await membersService.findOne({ 
                    where: { 
                        userId: user1.user.id,
                        chatId: dialog.id,
                        isDeleted: false
                    } 
                });
                
                expect(res.status).toEqual(201);
                const message: MessageResponse = res.body;
                expect(message).toHaveProperty('id');
                expect(uuid.validate(message.id)).toBeTruthy();
                expect(uuid.version(message.id)).toEqual(4);
                expect(message).toHaveProperty('text', payload.text);
                expect(message).toHaveProperty('memberId', member.id);
                expect(message).toHaveProperty('createdAt');
                expect(new Date(message.createdAt).getTime()).not.toBeNaN();
            });

            it('should return 404 status when the message was send to non-exists chat', async () => {
                const [user1, user2] = users;
                const payload = { text: 'Hi' };

                const res = await request(app.getHttpServer())
                    .post(`/me/chats/${uuid.v4()}/messages`)
                    .set('Authorization', `Bearer ${user1.tokens.accessToken}`)
                    .send(payload);

                expect(res.status).toEqual(404);
            });
        });
        
        describe('[Deleting] ...', () => {
            it('should delete the message', async () => {
                const [user1, user2] = users;
                const payload = { text: 'Hi' };

                const resCreation = await request(app.getHttpServer())
                    .post(`/me/chats/${dialog.id}/messages`)
                    .set('Authorization', `Bearer ${user1.tokens.accessToken}`)
                    .send(payload);

                const resDeleting = await request(app.getHttpServer())
                    .delete(`/me/chats/${dialog.id}/messages/${resCreation.body.id}`)
                    .set('Authorization', `Bearer ${user1.tokens.accessToken}`)
                    .send();

                const member = await membersService.findOne({ 
                    where: { 
                        userId: user1.user.id,
                        chatId: dialog.id,
                        isDeleted: false
                    } 
                });
                
                expect(resDeleting.status).toEqual(200);
                const message: MessageResponse = resDeleting.body;
                expect(message).toHaveProperty('id');
                expect(uuid.validate(message.id)).toBeTruthy();
                expect(uuid.version(message.id)).toEqual(4);
                expect(message).toHaveProperty('text', payload.text);
                expect(message).toHaveProperty('memberId', member.id);
                expect(message).toHaveProperty('createdAt');
                expect(new Date(message.createdAt).getTime()).not.toBeNaN();
                
                const m = await messagesService.findOne({ select: ['isDeleted'], where: { id: message.id } });
                expect(m).toHaveProperty('isDeleted', true);
            });
            it('should return 403 when the second user trying to delete not him the message', async () => {
                const [user1, user2] = users;
                const payload = { text: 'Hi' };

                const resCreation = await request(app.getHttpServer())
                    .post(`/me/chats/${dialog.id}/messages`)
                    .set('Authorization', `Bearer ${user1.tokens.accessToken}`)
                    .send(payload);

                const resDeleting = await request(app.getHttpServer())
                    .delete(`/me/chats/${dialog.id}/messages/${resCreation.body.id}`)
                    .set('Authorization', `Bearer ${user2.tokens.accessToken}`)
                    .send();
                
                expect(resDeleting.status).toEqual(403);
            });
        });
    });
});
 */