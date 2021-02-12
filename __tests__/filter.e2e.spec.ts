import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { config as setupDotEnv } from 'dotenv';
import cookieParser from 'cookie-parser';
import { getConnection, Connection, SelectQueryBuilder } from 'typeorm';
import { AppModule } from '@src/app.module';
import MessageEntity from '@db/entities/message.entity';
import {
  Filter,
  FilterArg,
  makeSelectField,
  OperatorTypeEnum
} from '@lib/filter/filter';
import { MessagesFieldArgumentEnum } from '@schema/models/messages/messages.dto';
import * as uuid from 'uuid';

setupDotEnv();

jest.setTimeout(50000);

describe('[E2E] [Filter] ...', () => {
  let app: INestApplication;
  let connection: Connection;
  let builder: SelectQueryBuilder<MessageEntity>;
  let select: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();

    connection = getConnection();

    builder = connection
      .getRepository(MessageEntity)
      .createQueryBuilder('messages')
      .select(makeSelectField('messages', 'id'));

    select = builder.getSql();
  });

  afterAll(async () => {
    await app.close();
    await connection.close();
  });

  describe('[Templates] ...', () => {
    it('WHERE arg', async () => {
      const filter = new Filter(builder.clone());
      const key = MessagesFieldArgumentEnum.ID;
      const query: FilterArg = {
        field: {
          name: key,
          op: OperatorTypeEnum.EQUALS,
          val: uuid.v4()
        }
      };

      const qb = filter.make(query);
      await qb.getRawMany();

      expect(qb.getSql()).toStrictEqual(`${select} WHERE (${key} = $1)`);
    });

    it('WHERE arg OR arg OR arg', async () => {
      const filter = new Filter(builder.clone());
      const key = MessagesFieldArgumentEnum.ID;
      const query: FilterArg = {
        OR: [
          {
            field: {
              name: key,
              op: OperatorTypeEnum.EQUALS,
              val: uuid.v4()
            }
          },
          {
            field: {
              name: key,
              op: OperatorTypeEnum.EQUALS,
              val: uuid.v4()
            }
          },
          {
            field: {
              name: key,
              op: OperatorTypeEnum.EQUALS,
              val: uuid.v4()
            }
          }
        ]
      };

      const qb = filter.make(query);
      await qb.getRawMany();

      expect(qb.getSql()).toStrictEqual(
        `${select} WHERE (${key} = $1 OR ${key} = $2 OR ${key} = $3)`
      );
    });

    it('WHERE arg OR arg OR (arg AND arg)', async () => {
      const filter = new Filter(builder.clone());
      const key = MessagesFieldArgumentEnum.ID;
      const query: FilterArg = {
        OR: [
          {
            field: {
              name: key,
              op: OperatorTypeEnum.EQUALS,
              val: uuid.v4()
            }
          },
          {
            field: {
              name: key,
              op: OperatorTypeEnum.EQUALS,
              val: uuid.v4()
            }
          },
          {
            AND: [
              {
                field: {
                  name: key,
                  op: OperatorTypeEnum.EQUALS,
                  val: uuid.v4()
                }
              },
              {
                field: {
                  name: key,
                  op: OperatorTypeEnum.EQUALS,
                  val: uuid.v4()
                }
              }
            ]
          }
        ]
      };

      const qb = filter.make(query);
      await qb.getRawMany();

      expect(qb.getSql()).toStrictEqual(
        `${select} WHERE (${key} = $1 OR ${key} = $2 OR (${key} = $3 AND ${key} = $4))`
      );
    });

    it('WHERE arg OR arg OR (arg AND (arg OR arg OR arg))', async () => {
      const filter = new Filter(builder.clone());
      const key = MessagesFieldArgumentEnum.ID;
      const query: FilterArg = {
        OR: [
          {
            field: {
              name: key,
              op: OperatorTypeEnum.EQUALS,
              val: uuid.v4()
            }
          },
          {
            field: {
              name: key,
              op: OperatorTypeEnum.EQUALS,
              val: uuid.v4()
            }
          },
          {
            AND: [
              {
                field: {
                  name: key,
                  op: OperatorTypeEnum.EQUALS,
                  val: uuid.v4()
                }
              },
              {
                OR: [
                  {
                    field: {
                      name: key,
                      op: OperatorTypeEnum.EQUALS,
                      val: uuid.v4()
                    }
                  },
                  {
                    field: {
                      name: key,
                      op: OperatorTypeEnum.EQUALS,
                      val: uuid.v4()
                    }
                  },
                  {
                    field: {
                      name: key,
                      op: OperatorTypeEnum.EQUALS,
                      val: uuid.v4()
                    }
                  }
                ]
              }
            ]
          }
        ]
      };

      const qb = filter.make(query);
      await qb.getRawMany();

      expect(qb.getSql()).toStrictEqual(
        `${select} WHERE (${key} = $1 OR ${key} = $2 OR (${key} = $3 AND (${key} = $4 OR ${key} = $5 OR ${key} = $6)))`
      );
    });

    it('WHERE arg AND arg AND (arg OR arg)', async () => {
      const filter = new Filter(builder.clone());
      const key = MessagesFieldArgumentEnum.ID;
      const query: FilterArg = {
        AND: [
          {
            field: {
              name: key,
              op: OperatorTypeEnum.EQUALS,
              val: uuid.v4()
            }
          },
          {
            field: {
              name: key,
              op: OperatorTypeEnum.EQUALS,
              val: uuid.v4()
            }
          },
          {
            OR: [
              {
                field: {
                  name: key,
                  op: OperatorTypeEnum.EQUALS,
                  val: uuid.v4()
                }
              },
              {
                field: {
                  name: key,
                  op: OperatorTypeEnum.EQUALS,
                  val: uuid.v4()
                }
              }
            ]
          }
        ]
      };

      const qb = filter.make(query);
      await qb.getRawMany();

      expect(qb.getSql()).toStrictEqual(
        `${select} WHERE (${key} = $1 AND ${key} = $2 AND (${key} = $3 OR ${key} = $4))`
      );
    });
  });

  describe('[Operators] ...', () => {
    it('[EQUALS]', async () => {
      const filter = new Filter(builder.clone());
      const key = MessagesFieldArgumentEnum.ID;
      const query: FilterArg = {
        field: {
          name: key,
          op: OperatorTypeEnum.EQUALS,
          val: uuid.v4()
        }
      };

      const qb = filter.make(query);
      await qb.getRawMany();

      expect(qb.getSql()).toStrictEqual(`${select} WHERE (${key} = $1)`);
    });

    it('[LESS]', async () => {
      const filter = new Filter(builder.clone());
      const key = MessagesFieldArgumentEnum.ID;
      const query: FilterArg = {
        field: {
          name: key,
          op: OperatorTypeEnum.LESS,
          val: uuid.v4()
        }
      };

      const qb = filter.make(query);
      await qb.getRawMany();

      expect(qb.getSql()).toStrictEqual(`${select} WHERE (${key} < $1)`);
    });

    it('[LESS_OR_EQUAL]', async () => {
      const filter = new Filter(builder.clone());
      const key = MessagesFieldArgumentEnum.ID;
      const query: FilterArg = {
        field: {
          name: key,
          op: OperatorTypeEnum.LESS_OR_EQUAL,
          val: uuid.v4()
        }
      };

      const qb = filter.make(query);
      await qb.getRawMany();

      expect(qb.getSql()).toStrictEqual(`${select} WHERE (${key} <= $1)`);
    });

    it('[GREATER]', async () => {
      const filter = new Filter(builder.clone());
      const key = MessagesFieldArgumentEnum.ID;
      const query: FilterArg = {
        field: {
          name: key,
          op: OperatorTypeEnum.GREATER,
          val: uuid.v4()
        }
      };

      const qb = filter.make(query);
      await qb.getRawMany();

      expect(qb.getSql()).toStrictEqual(`${select} WHERE (${key} > $1)`);
    });

    it('[GREATER_OR_EQUAL]', async () => {
      const filter = new Filter(builder.clone());
      const key = MessagesFieldArgumentEnum.ID;
      const query: FilterArg = {
        field: {
          name: key,
          op: OperatorTypeEnum.GREATER_OR_EQUAL,
          val: uuid.v4()
        }
      };

      const qb = filter.make(query);
      await qb.getRawMany();

      expect(qb.getSql()).toStrictEqual(`${select} WHERE (${key} >= $1)`);
    });

    it('[NOT_EQUAL]', async () => {
      const filter = new Filter(builder.clone());
      const key = MessagesFieldArgumentEnum.ID;
      const query: FilterArg = {
        field: {
          name: key,
          op: OperatorTypeEnum.NOT_EQUAL,
          val: uuid.v4()
        }
      };

      const qb = filter.make(query);
      await qb.getRawMany();

      expect(qb.getSql()).toStrictEqual(`${select} WHERE (${key} <> $1)`);
    });
  });

  describe('[Nested] ...', () => {
    it('[MEMBER_ID]', async () => {
      const filter = new Filter(
        builder.clone().leftJoin('messages.member', 'member')
      );
      const key = MessagesFieldArgumentEnum.MEMBER_ID;
      const query: FilterArg = {
        field: {
          name: key,
          op: OperatorTypeEnum.EQUALS,
          val: uuid.v4()
        }
      };

      const qb = filter.make(query);
      await qb.getRawMany();

      expect(qb.getSql()).toStrictEqual(
        `${select} LEFT JOIN "members" "member" ON "member"."id"="messages"."member_id" WHERE (${key} = $1)`
      );
    });

    it('[USER_ID]', async () => {
      const filter = new Filter(
        builder.clone().leftJoin('messages.member', 'member')
      );
      const key = MessagesFieldArgumentEnum.MEMBER_USER_ID;
      const query: FilterArg = {
        field: {
          name: key,
          op: OperatorTypeEnum.EQUALS,
          val: uuid.v4()
        }
      };

      const qb = filter.make(query);
      await qb.getRawMany();

      expect(qb.getSql()).toStrictEqual(
        `${select} LEFT JOIN "members" "member" ON "member"."id"="messages"."member_id" WHERE (${key} = $1)`
      );
    });
  });
});
