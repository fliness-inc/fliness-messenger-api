import { Injectable, UnauthorizedException } from '@nestjs/common';
import UsersService from '@schema/models/users/users.service';
import User from '@db/entities/user.entity';
import bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  public constructor(private readonly usersService: UsersService) {}

  public async signIn(email: string, password: string): Promise<User> {
    const user = await this.usersService.findOne({ where: { email } });

    if (!user)
      throw new UnauthorizedException(
        `The user was not found with the email: ${email}`
      );

    if (!bcrypt.compareSync(password, user.password))
      throw new UnauthorizedException(`The authentication fails`);

    return user;
  }

  public async signUp(
    name: string,
    email: string,
    password: string
  ): Promise<User> {
    return this.usersService.create({ name, email, password });
  }
}

export default AuthService;
