import { Resolver, Query } from '@nestjs/graphql';
import User from '@schema/models/user';

@Resolver(of => User)
export class UsersResover {

    @Query(returns => [User], { name: 'users' })
    public async getAll(): Promise<User[]> {
        return [];
    }

}

export default UsersResover;