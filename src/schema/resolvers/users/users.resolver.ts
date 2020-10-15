import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation } from '@nestjs/graphql';
import User from '@schema/models/user';
import AuthGuard from '@schema/resolvers/auth/auth.guard';
import UsersService from '@schema/resolvers/users/users.service';
import CurrentUser from '@schema/resolvers/auth/current-user';
 
@Resolver(of => User)
export class UsersResolver {

    constructor(private readonly usersService: UsersService) {}

    
}

export default UsersResolver;