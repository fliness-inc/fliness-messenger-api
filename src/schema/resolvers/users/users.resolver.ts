import { UseGuards } from '@nestjs/common';
import { Resolver, Query } from '@nestjs/graphql';
import User from '@schema/models/user';
import AuthGuard from '@schema/resolvers/auth/auth.guard';
import UsersService from '@schema/resolvers/users/users.service';
import CurrentUser from '@schema/resolvers/auth/current-user';
 
@Resolver(of => User)
export class UsersResolver {

    constructor(private readonly usersService: UsersService) {}

    @UseGuards(AuthGuard)
    @Query(returns => User, { name: 'me' })
    public async getProfile(@CurrentUser() user: any): Promise<User> {
        return await this.usersService.findOne({ where: { id: user.id } });
    }

}

export default UsersResolver;