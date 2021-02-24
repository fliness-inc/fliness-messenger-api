import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserEntity } from '@db/entities/user.entity';
import { UsersService } from '@modules/users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  public constructor(private readonly usersService: UsersService) {}

  public async signIn(email: string, password: string): Promise<UserEntity> {
    const user = await this.usersService.findOne({ where: { email } });

    if (!user)
      throw new NotFoundException(
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
  ): Promise<UserEntity> {
    return this.usersService.create({ name, email, password });
  }
}

export default AuthService;
