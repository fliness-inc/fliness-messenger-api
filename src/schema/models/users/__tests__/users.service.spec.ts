import { Test, TestingModule } from '@nestjs/testing';
import faker from 'faker';
import UsersService from '@schema/models/users/users.service';
import {
  initTestDatabase,
  createTestDatabase
} from '@tools/test-db-connection';
import { Connection, Repository } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User as UserEntity } from '@db/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import bcryptjs from 'bcryptjs';

jest.setTimeout(50000);

describe('[Users Module] ...', () => {
  let moduleRef: TestingModule;
  let connection: Connection;
  let usersService: UsersService;
  let usersRepository: Repository<UserEntity>;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(),
        TypeOrmModule.forFeature([UserEntity])
      ],
      providers: [UsersService]
    }).compile();

    connection = await createTestDatabase();
    await initTestDatabase();

    usersService = moduleRef.get<UsersService>(UsersService);
    usersRepository = moduleRef.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity)
    );
  });

  beforeEach(async () => {
    await connection.query('TRUNCATE users CASCADE');
  });

  afterAll(async () => {
    await moduleRef.close();
    await connection.close();
  });

  describe('', () => {
    it('should return users', async () => {
      const entity: UserEntity = usersRepository.create({
        name: faker.internet.userName(),
        email: faker.internet.email(),
        password: faker.random.word()
      });

      const userEntity = await usersService.create(entity);

      expect(userEntity.name).toEqual(entity.name);
      expect(userEntity.email).toEqual(entity.email);
      expect(
        bcryptjs.compareSync(entity.password, userEntity.password)
      ).toBeTruthy();

      expect(await usersRepository.count()).toEqual(1);
    });
  });
});
