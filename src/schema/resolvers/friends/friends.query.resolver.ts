import { UseGuards } from '@nestjs/common';
import { Resolver, ResolveField, Parent, Args } from '@nestjs/graphql';
import AuthGuard from '@schema/resolvers/auth/auth.guard';
import User from '@schema/models/users/users.model';
import FriendConnection, { FriendPaginationInput, FriendPaginationField } from '@schema/models/friends/friends.model.pagination';
import Sort from '@schema/types/sort';
import { Direction, Order } from '@src/pagination/enums';
import { getRepository } from 'typeorm';
import Pagination from '@src/pagination/pagination';
import MeQuery from '@schema/models/me/me.query';
import FriendEntity from '@database/entities/friend';

@UseGuards(AuthGuard)
@Resolver(() => MeQuery)
export class FriendsResolver {
    
    @ResolveField('friends', () => FriendConnection)
	public async getFriends(
        @Parent() user: User,
        	@Args('pagination', { type: () => FriendPaginationInput, nullable: true }) pagination: FriendPaginationInput = {},
        	@Args('sort', { type: () => Sort, nullable: true }) sort: Sort = { by: Order.ASC }
	): Promise<FriendConnection> {

		const { after, before, first, last, fields = [] } = pagination;
        
		const builder = getRepository(FriendEntity)
			.createQueryBuilder('friends')
			.select(Pagination.makeSelectField('friend', 'id'))
			.addSelect(Pagination.makeSelectField('friend', 'name'))
			.addSelect(Pagination.makeSelectField('friend', 'email'))
			.addSelect(Pagination.makeSelectField('friend', 'avatarURL'))
			.leftJoin('friends.user', 'user')
			.leftJoin('friends.friend', 'friend')
			.where('"user"."id" = :userId', { userId: user.id })
			.andWhere('"friends"."is_deleted" = :isDeleted', { isDeleted: false });

		if (!fields.includes(FriendPaginationField.ID))
			fields.push(FriendPaginationField.ID);

		const paginator = new Pagination.Paginator({ 
			builder,
			uniqueKey: FriendPaginationField.ID,
			keys: fields,
			afterCursor: after,
			beforeCursor: before,
			limit: first || last,
			order: sort.by,
			direction: last || before ? Direction.PREVIOUS : Direction.NEXT
		});

		return paginator.paginate((entity: any) => ({
				id: entity[Pagination.makeFormatedField('friend', 'id')],
				name: entity[Pagination.makeFormatedField('friend', 'name')],
				email: entity[Pagination.makeFormatedField('friend', 'email')],
				avatarURL: entity[Pagination.makeFormatedField('friend', 'avatarURL')],
			})
		);
	}
}

export default FriendsResolver;
