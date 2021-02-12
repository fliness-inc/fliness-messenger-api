import { Test } from '@nestjs/testing';
import facker from 'faker';
import { AuthService } from '@schema/models/auth/auth.service';
import { UsersService } from '@schema/models/users/users.service';
import { User as UserEntity } from '@db/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';

describe('[Auth Module] ...', () => {
  let authService: AuthService;
  let usersService: UsersService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        {
          provide: getRepositoryToken(UserEntity),
          useFactory: jest.fn(() => {})
        }
      ]
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
    usersService = moduleRef.get<UsersService>(UsersService);
  });

  describe('[Auth Service] ...', () => {
    describe('[Sign up] ...', () => {
      it('should signed up a user', async () => {
        const user = new UserEntity();
        user.name = facker.internet.userName();
        user.password = facker.internet.password();
        user.email = facker.internet.email();

        jest.spyOn(usersService, 'create').mockResolvedValueOnce(user);

        expect(
          await authService.signUp(user.name, user.email, user.password)
        ).toStrictEqual(user);
      });
    });

    describe('[Sign In] ...', () => {
      it('should signed in a user', async () => {
        const password = facker.internet.password();
        const salt = bcrypt.genSaltSync();

        const user = new UserEntity();
        user.name = facker.internet.userName();
        user.password = bcrypt.hashSync(password, salt);
        user.email = facker.internet.email();

        jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(user);

        expect(await authService.signIn(user.email, password)).toStrictEqual(
          user
        );
      });

      it('should throw error when user was not found', async () => {
        jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(undefined);

        expect(
          authService.signIn(
            facker.internet.email(),
            facker.internet.userName()
          )
        ).rejects.toBeInstanceOf(Error);
      });

      it('should throw error when user entered incorrect password', async () => {
        const password = facker.internet.password();
        const salt = bcrypt.genSaltSync();

        const user = new UserEntity();
        user.name = facker.internet.userName();
        user.password = bcrypt.hashSync(password, salt);
        user.email = facker.internet.email();

        jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(user);

        expect(
          authService.signIn(user.email, facker.internet.userName())
        ).rejects.toBeInstanceOf(Error);
      });
    });
  });
});
