import { UseGuards } from '@nestjs/common';
import { Resolver, ResolveField, Field, Args, Parent } from '@nestjs/graphql';
import AuthGuard from '@schema/resolvers/auth/auth.guard';
import { MembersFilter } from '@schema/resolvers/members/members.dto';
import Chat from '@schema/models/chats/chats.model';
import Sort from '@schema/types/sort';
import { Direction, Order } from '@src/pagination/enums';
import MemberConnection, { MemberPaginationField, MemberPaginationInput } from '@/src/schema/models/members/members.model.pagination';
import { InjectRepository } from '@nestjs/typeorm';
import Member from '@database/entities/member';
import { Repository } from 'typeorm';
import Pagination from '@src/pagination/pagination';
import Filter from '@src/filter/filter';

@UseGuards(AuthGuard)
@Resolver(() => Chat)
export class MembersQueryResolver {

	public constructor(
        @InjectRepository(Member)
        private readonly membersRespository: Repository<Member>,
	) {}

    @Field(() => MemberConnection, { name: 'members' })
    public readonly members: MemberConnection;

    @ResolveField(() => MemberConnection, { name: 'members' })
    public async getMembers(
        @Parent() chat: Chat,
        	@Args('pagination', { type: () => MemberPaginationInput, nullable: true }) pagination: MemberPaginationInput = {},
        	@Args('sort', { type: () => Sort, nullable: true }) sort: Sort = { by: Order.ASC },
        	@Args('filter', { type: () => MembersFilter, nullable: true }) filter: MembersFilter = <any>{}
    ): Promise<MemberConnection> {

    	const { after, before, first, last, fields = [] } = pagination;
        
		const builder = this.membersRespository
			.createQueryBuilder('member')
    		.select(Pagination.makeSelectField('member', 'id'))
    		.addSelect(Pagination.makeSelectField('member', 'chat_id'))
    		.addSelect(Pagination.makeSelectField('member', 'user_id'))
    		.addSelect(Pagination.makeSelectField('member', 'updated_at'))
    		.addSelect(Pagination.makeSelectField('member', 'created_at'))
    		.addSelect(Pagination.makeSelectField('role', 'name'))
    		.leftJoin('member.role', 'role')
    		.where('"member"."is_deleted" = :isDeleted', { isDeleted: false })
    		.andWhere('"member"."chat_id" = :chatId', { chatId: chat.id });

    	const filterManager = new Filter(builder);
    	filterManager.make(filter);

    	if (!fields.includes(MemberPaginationField.ID))
    		fields.push(MemberPaginationField.ID);

    	const paginator = new Pagination.Paginator({ 
    		builder,
    		uniqueKey: MemberPaginationField.ID,
    		keys: fields,
    		afterCursor: after,
    		beforeCursor: before,
    		limit: first || last,
    		order: sort.by,
    		direction: last || before ? Direction.PREVIOUS : Direction.NEXT
    	});

    	return paginator.paginate((entity: any) => ({
    		id: entity[Pagination.makeFormatedField('member', 'id')],
    		chatId: entity[Pagination.makeFormatedField('member', 'chat_id')],
    		userId: entity[Pagination.makeFormatedField('member', 'user_id')],
    		updatedAt: entity[Pagination.makeFormatedField('member', 'updated_at')],
    		createdAt: entity[Pagination.makeFormatedField('member', 'created_at')],
    		role: entity[Pagination.makeFormatedField('role', 'name')]
    	}));
    }
}

export default MembersQueryResolver;