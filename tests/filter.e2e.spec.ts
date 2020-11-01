import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { config as setupDotEnv } from 'dotenv';
import cookieParser from 'cookie-parser';
import { getConnection, Connection, SelectQueryBuilder } from 'typeorm';
import { AppModule } from '@src/app.module';
import Message from '@database/entities/message';
import Filter, { FilterArg, OperatorTypeEnum } from '@src/filter/filter';
import { MessageFieldArgumentEnum } from '@schema/resolvers/messages/messages.dto';
import * as uuid from 'uuid';

setupDotEnv();

jest.setTimeout(50000);

describe('[E2E] [Filter] ...', () => {
    let app: INestApplication;
    let connection: Connection;
    let builder: SelectQueryBuilder<Message>;
    let select: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.use(cookieParser());
        await app.init();

        connection = getConnection();

        builder = connection.getRepository(Message).createQueryBuilder('message')
            .select('message.id', 'id');

            select = `SELECT "message"."id" AS "id" FROM "messages" "message"`;
    });

    afterAll(async () => {
        await app.close();
        await connection.close();
    }); 

    describe('[Templates] ...', () => {
        
        it('WHERE arg', async () => {

            const filter = new Filter(builder.clone());
            const query: FilterArg = {
                field: {
                    name: MessageFieldArgumentEnum.ID,
                    op: OperatorTypeEnum.EQUALS,
                    val: uuid.v4()
                }
            };

            const qb = filter.make(query);
            await qb.getRawMany();

            expect(qb.getSql())
                .toStrictEqual(`${select} WHERE ("message"."id" = $1)`);
        });

        it('WHERE arg OR arg OR arg', async () => {

            const filter = new Filter(builder.clone());
            const query: FilterArg = {
                OR: [
                    { field: { name: MessageFieldArgumentEnum.ID, op: OperatorTypeEnum.EQUALS, val: uuid.v4() } },
                    { field: { name: MessageFieldArgumentEnum.ID, op: OperatorTypeEnum.EQUALS, val: uuid.v4() } },
                    { field: { name: MessageFieldArgumentEnum.ID, op: OperatorTypeEnum.EQUALS, val: uuid.v4() } },
                ]
            };

            const qb = filter.make(query);
            await qb.getRawMany();

            expect(qb.getSql())
                .toStrictEqual(`${select} WHERE ("message"."id" = $1 OR "message"."id" = $2 OR "message"."id" = $3)`);
        });

        it('WHERE arg OR arg OR (arg AND arg)', async () => {

            const filter = new Filter(builder.clone());
            const query: FilterArg = {
                OR: [
                    { field: { name: MessageFieldArgumentEnum.ID, op: OperatorTypeEnum.EQUALS, val: uuid.v4() } },
                    { field: { name: MessageFieldArgumentEnum.ID, op: OperatorTypeEnum.EQUALS, val: uuid.v4() } },
                    { AND: [ 
                            { field: { name: MessageFieldArgumentEnum.ID, op: OperatorTypeEnum.EQUALS, val: uuid.v4() }},
                            { field: { name: MessageFieldArgumentEnum.ID, op: OperatorTypeEnum.EQUALS, val: uuid.v4() }} 
                        ] 
                    },
                ]
            };

            const qb = filter.make(query);
            await qb.getRawMany();

            expect(qb.getSql())
                .toStrictEqual(`${select} WHERE ("message"."id" = $1 OR "message"."id" = $2 OR ("message"."id" = $3 AND "message"."id" = $4))`);
        });

        it('WHERE arg OR arg OR (arg AND (arg OR arg OR arg))', async () => {

            const filter = new Filter(builder.clone());
            const query: FilterArg = {
                OR: [
                    { field: { name: MessageFieldArgumentEnum.ID, op: OperatorTypeEnum.EQUALS, val: uuid.v4() } },
                    { field: { name: MessageFieldArgumentEnum.ID, op: OperatorTypeEnum.EQUALS, val: uuid.v4() } },
                    { AND: [ 
                            { field: { name: MessageFieldArgumentEnum.ID, op: OperatorTypeEnum.EQUALS, val: uuid.v4() } },
                            { OR: [
                                    { field: { name: MessageFieldArgumentEnum.ID, op: OperatorTypeEnum.EQUALS, val: uuid.v4() } },
                                    { field: { name: MessageFieldArgumentEnum.ID, op: OperatorTypeEnum.EQUALS, val: uuid.v4() } },
                                    { field: { name: MessageFieldArgumentEnum.ID, op: OperatorTypeEnum.EQUALS, val: uuid.v4() } }
                                ] 
                            } 
                        ] 
                    },
                ]
            };

            const qb = filter.make(query);
            await qb.getRawMany();

            expect(qb.getSql())
                .toStrictEqual(`${select} WHERE ("message"."id" = $1 OR "message"."id" = $2 OR ("message"."id" = $3 AND ("message"."id" = $4 OR "message"."id" = $5 OR "message"."id" = $6)))`);
        });

        it('WHERE arg AND arg AND (arg OR arg)', async () => {

            const filter = new Filter(builder.clone());
            const query: FilterArg = {
                AND: [
                    { field: { name: MessageFieldArgumentEnum.ID, op: OperatorTypeEnum.EQUALS, val: uuid.v4() } },
                    { field: { name: MessageFieldArgumentEnum.ID, op: OperatorTypeEnum.EQUALS, val: uuid.v4() } },
                    { OR: [ 
                            { field: { name: MessageFieldArgumentEnum.ID, op: OperatorTypeEnum.EQUALS, val: uuid.v4() }},
                            { field: { name: MessageFieldArgumentEnum.ID, op: OperatorTypeEnum.EQUALS, val: uuid.v4() }} 
                        ] 
                    },
                ]
            };

            const qb = filter.make(query);
            await qb.getRawMany();

            expect(qb.getSql())
                .toStrictEqual(`${select} WHERE ("message"."id" = $1 AND "message"."id" = $2 AND ("message"."id" = $3 OR "message"."id" = $4))`);
        });
    });

    describe('[Operators] ...', () => {
        it('[EQUALS]', async () => {
            const filter = new Filter(builder.clone());
            const query: FilterArg = {
                field: {
                    name: MessageFieldArgumentEnum.ID,
                    op: OperatorTypeEnum.EQUALS,
                    val: uuid.v4()
                }
            };

            const qb = filter.make(query);
            await qb.getRawMany();

            expect(qb.getSql())
                .toStrictEqual(`${select} WHERE ("message"."id" = $1)`);
        });

        it('[LESS]', async () => {
            const filter = new Filter(builder.clone());
            const query: FilterArg = {
                field: {
                    name: MessageFieldArgumentEnum.ID,
                    op: OperatorTypeEnum.LESS,
                    val: uuid.v4()
                }
            };

            const qb = filter.make(query);
            await qb.getRawMany();

            expect(qb.getSql())
                .toStrictEqual(`${select} WHERE ("message"."id" < $1)`);
        });

        it('[LESS_OR_EQUAL]', async () => {
            const filter = new Filter(builder.clone());
            const query: FilterArg = {
                field: {
                    name: MessageFieldArgumentEnum.ID,
                    op: OperatorTypeEnum.LESS_OR_EQUAL,
                    val: uuid.v4()
                }
            };

            const qb = filter.make(query);
            await qb.getRawMany();

            expect(qb.getSql())
                .toStrictEqual(`${select} WHERE ("message"."id" <= $1)`);
        });

        it('[GREATER]', async () => {
            const filter = new Filter(builder.clone());
            const query: FilterArg = {
                field: {
                    name: MessageFieldArgumentEnum.ID,
                    op: OperatorTypeEnum.GREATER,
                    val: uuid.v4()
                }
            };

            const qb = filter.make(query);
            await qb.getRawMany();

            expect(qb.getSql())
                .toStrictEqual(`${select} WHERE ("message"."id" > $1)`);
        });

        it('[GREATER_OR_EQUAL]', async () => {
            const filter = new Filter(builder.clone());
            const query: FilterArg = {
                field: {
                    name: MessageFieldArgumentEnum.ID,
                    op: OperatorTypeEnum.GREATER_OR_EQUAL,
                    val: uuid.v4()
                }
            };

            const qb = filter.make(query);
            await qb.getRawMany();

            expect(qb.getSql())
                .toStrictEqual(`${select} WHERE ("message"."id" >= $1)`);
        });

        it('[NOT_EQUAL]', async () => {
            const filter = new Filter(builder.clone());
            const query: FilterArg = {
                field: {
                    name: MessageFieldArgumentEnum.ID,
                    op: OperatorTypeEnum.NOT_EQUAL,
                    val: uuid.v4()
                }
            };

            const qb = filter.make(query);
            await qb.getRawMany();

            expect(qb.getSql())
                .toStrictEqual(`${select} WHERE ("message"."id" <> $1)`);
        });
    });

    describe('[Nested] ...', () => {
        it('[MEMBER_ID]', async () => {
            const filter = new Filter(builder.clone().leftJoin('message.member', 'member'));
            const query: FilterArg = {
                field: {
                    name: MessageFieldArgumentEnum.MEMBER_ID,
                    op: OperatorTypeEnum.EQUALS,
                    val: uuid.v4()
                }
            };

            const qb = filter.make(query);
            await qb.getRawMany();

            expect(qb.getSql())
                .toStrictEqual(`${select} LEFT JOIN \"members\" \"member\" ON \"member\".\"id\"=\"message\".\"member_id\" WHERE ("member"."id" = $1)`);
        });

        it('[USER_ID]', async () => {
            const filter = new Filter(builder.clone().leftJoin('message.member', 'member'));
            const query: FilterArg = {
                field: {
                    name: MessageFieldArgumentEnum.MEMBER_USER_ID,
                    op: OperatorTypeEnum.EQUALS,
                    val: uuid.v4()
                }
            };

            const qb = filter.make(query);
            await qb.getRawMany();

            expect(qb.getSql())
                .toStrictEqual(`${select} LEFT JOIN \"members\" \"member\" ON \"member\".\"id\"=\"message\".\"member_id\" WHERE ("member"."user_id" = $1)`);
        });
    });
});
