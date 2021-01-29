import { Resolver, Query, Args, Context } from '@nestjs/graphql';
import CurrentUser from '@schema/resolvers/auth/current-user';
import User from '@schema/models/users/users.model';
import Pagination from '@src/pagination/pagination';
import UserConnection, { UserPaginationField, UserPaginationInput } from '@schema/models/users/users.model.pagination';
import Sort from '@schema/types/sort';
import { UsersFilter } from '@schema/resolvers/users/users.dto';
import { Direction, Order } from '@src/pagination/enums';
import { getRepository } from 'typeorm';
import UserEntity from '@database/entities/user';
import Filter from '@src/filter/filter';

@Resolver(of => User)
export class UsersQueryResolver {

    @Query(() => UserConnection, { name: 'users' })
    public async getUsers(
			@CurrentUser() user: User,
			@Context() ctx,
        	@Args('pagination', { type: () => UserPaginationInput, nullable: true }) pagination: UserPaginationInput = {},
        	@Args('sort', { type: () => Sort, nullable: true }) sort: Sort = { by: Order.ASC },
        	@Args('filter', { type: () => UsersFilter, nullable: true }) filter: UsersFilter = <any>{}
    ): Promise<UserConnection> {
		const { after, before, first, last, fields = [] } = pagination;
        
		const builder = getRepository(UserEntity)
			.createQueryBuilder('user')
    		.select(Pagination.makeSelectField('user', 'id'))
    		.addSelect(Pagination.makeSelectField('user', 'name'))
			.addSelect(Pagination.makeSelectField('user', 'email'))
			.addSelect(Pagination.makeSelectField('user', 'avatarURL'))
			.where('"user"."is_deleted" = :isDeleted', { isDeleted: false });
			
    	const filterManager = new Filter(builder);
    	filterManager.make(filter);

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
				id: entity[Pagination.makeFormatedField('user', 'id')],
				name: entity[Pagination.makeFormatedField('user', 'name')],
				email: entity[Pagination.makeFormatedField('user', 'email')],
				avatarURL: entity[Pagination.makeFormatedField('user', 'avatarURL')] ? 
					`http://${process.env.HOST}:${process.env.PORT}/public/${entity[Pagination.makeFormatedField('user', 'avatarURL')]}` :
					null,
    		})
		);
	}
}

export default UsersQueryResolver;