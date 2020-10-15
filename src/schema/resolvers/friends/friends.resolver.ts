import { UseGuards } from '@nestjs/common';
import { Resolver, ResolveField, Field, Parent } from '@nestjs/graphql';
import FriendsService from '@schema/resolvers/friends/friends.service';
import AuthGuard from '@schema/resolvers/auth/auth.guard';
import User from '@schema/models/user';

@UseGuards(AuthGuard)
@Resolver(of => User)
export class FriendsResolver {
    public constructor(private readonly friendsService: FriendsService) {}

    @Field(type => [User])
    public readonly friends: User[];
    
    @ResolveField('friends', returns => [User])
    public async getFriends(@Parent() user: User): Promise<User[]> {
        const entities = await this.friendsService.find(alias => ({ 
            where: { 
                userId: user.id, 
                isDeleted: false 
            }, 
            join: {
                alias,
                leftJoinAndSelect: {
                    friend: `${alias}.friend`,
                }
            }
        }));
        return entities.map<User>(e => e.friend);
    }
}

export default FriendsResolver;
