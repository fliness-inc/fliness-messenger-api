import { UseGuards } from '@nestjs/common';
import { Resolver, ResolveField, Parent, Args } from '@nestjs/graphql';
import AuthGuard from '@schema/resolvers/auth/auth.guard';
import User from '@schema/models/users.model';
import UserConnection, { UserPaginationInput, UserPaginationField } from '@schema/models/users.pagination';
import Sort from '@schema/types/sort';
import { Direction, Order } from '@src/pagination/enums';
import { getRepository } from 'typeorm';
import * as Pagination from '@src/pagination/paginator';
import MeQuery from '@schema/models/me.query';
import FriendEntity from '@database/entities/friend';

@UseGuards(AuthGuard)
@Resolver(() => MeQuery)
export class FriendsResolver {
    
    @ResolveField('friends', () => UserConnection)
	public async getFriends(
        @Parent() user: User,
        	@Args('pagination', { type: () => UserPaginationInput, nullable: true }) pagination: UserPaginationInput = {},
        	@Args('sort', { type: () => Sort, nullable: true }) sort: Sort = { by: Order.ASC }
	): Promise<UserConnection> {

		const { after, before, first, last, fields = [] } = pagination;
        
		const builder = getRepository(FriendEntity).createQueryBuilder('t')
			.select('friend.id')
			.addSelect('friend.name')
			.addSelect('friend.email')
			.leftJoin('t.user', 'user', 'user.id = :userId', { userId: user.id })
			.leftJoin('t.friend', 'friend')
			.andWhere('t.is_deleted = :isDeleted', { isDeleted: false });

		if (!fields.includes(UserPaginationField.ID))
			fields.push(UserPaginationField.ID);

		const paginator = new Pagination.Paginator({ 
			builder,
			uniqueKey: UserPaginationField.ID,
			keys: fields,
			afterCursor: after,
			beforeCursor: before,
			limit: first || last,
			order: sort.by,
			direction: last || before ? Direction.PREVIOUS : Direction.NEXT
		});

		return paginator.paginate((entity: any) => ({
			id: entity.friend_id,
			name: entity.friend_name,
			email: entity.friend_email
		})
		);
	}
}

export default FriendsResolver;
