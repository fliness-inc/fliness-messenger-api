import { UseGuards} from '@nestjs/common';
import { Resolver, ResolveField, Args, Field } from '@nestjs/graphql';
import AuthGuard from '@schema/resolvers/auth/auth.guard';
import CurrentUser from '@schema/resolvers/auth/current-user';
import User from '@schema/models/users.model';
import MeQuery from '@schema/models/me.query';
import ChatsConnection, { ChatPaginationField, ChatPaginationInput } from '@schema/models/chats.pagination';
import Sort from '@schema/types/sort';
import { Direction, Order } from '@src/pagination/enums';
import ChatEntity from '@database/entities/chat';
import { getRepository } from 'typeorm';
import * as Pagination from '@src/pagination/paginator';
import { ChatsFilter } from '@schema/resolvers/chats/chats.dto';
import Filter from '@src/filter/filter';

@UseGuards(AuthGuard)
@Resolver(() => MeQuery)
export class ChatsModelResolver {

    @Field(() => ChatsConnection)
    public readonly chats: ChatsConnection;

    @ResolveField(() => ChatsConnection, { name: 'chats' })
    public async getChats(
        @CurrentUser() user: User,
        	@Args('pagination', { type: () => ChatPaginationInput, nullable: true }) pagination: ChatPaginationInput = {},
        	@Args('sort', { type: () => Sort, nullable: true }) sort: Sort = { by: Order.ASC },
        	@Args('filter', { type: () => ChatsFilter, nullable: true }) filter: ChatsFilter = <any>{}
    ): Promise<ChatsConnection> {

    	const { after, before, first, last, fields = [] } = pagination;
        
    	const builder = getRepository(ChatEntity).createQueryBuilder('chat')
    		.select('chat.id')
    		.addSelect('chat.title')
    		.addSelect('chat.description')
    		.addSelect('chat.created_at')
    		.addSelect('type.name')
    		.leftJoin('chat.type', 'type')
    		.leftJoin('chat.members', 'member')
			.where('chat.is_deleted = :isDeleted', { isDeleted: false })
			.andWhere('member.user_id = :userId', { userId: user.id });

		const filterManager = new Filter(builder);
		filterManager.make(filter);

    	if (!fields.includes(ChatPaginationField.ID))
    		fields.push(ChatPaginationField.ID);

    	const paginator = new Pagination.Paginator({ 
    		builder,
    		uniqueKey: ChatPaginationField.ID,
    		keys: fields,
    		afterCursor: after,
    		beforeCursor: before,
    		limit: first || last,
    		order: sort.by,
    		direction: last || before ? Direction.PREVIOUS : Direction.NEXT
    	});

    	return paginator.paginate((entity: any) => ({
    		id: entity.chat_id,
    		title: entity.chat_title,
    		description: entity.chat_description,
    		createdAt: entity.created_at,
    		type: entity.type_name
    	})
    	);
    }
}

export default ChatsModelResolver;