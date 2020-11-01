import { UseGuards } from '@nestjs/common';
import { Resolver, Field, ResolveField, Parent, Args } from '@nestjs/graphql';
import AuthGuard from '@schema/resolvers/auth/auth.guard';
import Chat from '@schema/models/chats.model';
import MessageEntity from '@database/entities/message';
import { MessageConnection, MessagePaginationInput, MessagePaginationField } from '@schema/models/messages.pagination';
import { Direction, Order } from '@src/pagination/enums';
import Sort from '@schema/types/sort';
import { getRepository } from 'typeorm';
import * as Pagination from '@src/pagination/paginator';
import { MessageFilter } from '@schema/resolvers/messages/messages.dto';
import Filter from '@src/filter/filter';

@UseGuards(AuthGuard/*, ChatGruard */)
@Resolver(() => Chat)
export class MessagesModelResolver {

    @Field(() => MessageConnection)
    public readonly messages: MessageConnection;

    //@ChatRoles(MemberRoleEnum.MEMBER)
    @ResolveField(() => MessageConnection, { name: 'messages' })
    public async getMessages(
        @Parent() chat: Chat,
        	@Args('pagination', { type: () => MessagePaginationInput, nullable: true }) pagination: MessagePaginationInput = {},
        	@Args('sort', { type: () => Sort, nullable: true }) sort: Sort = { by: Order.ASC },
        	@Args('filter', { type: () => MessageFilter, nullable: true }) filter: MessageFilter = {}
    ): Promise<MessageConnection> {
        
    	const { after, before, first, last, fields = [] } = pagination;
        
    	const builder = getRepository(MessageEntity).createQueryBuilder('message')
    		.select('message.id')
    		.addSelect('message.text')
    		.addSelect('message.member_id')
    		.addSelect('message.updated_at')
    		.addSelect('message.created_at')
    		.leftJoin('message.member', 'member')
    		.where('member.chat_id = :chatId', { chatId: chat.id })
    		.andWhere('message.is_deleted = :isDeleted', { isDeleted: false });

    	const filterManager = new Filter(builder);
    	filterManager.make(filter);

    	if (!fields.includes(MessagePaginationField.ID))
    		fields.push(MessagePaginationField.ID);

    	const paginator = new Pagination.Paginator({ 
    		builder,
    		uniqueKey: MessagePaginationField.ID,
    		keys: fields,
    		afterCursor: after,
    		beforeCursor: before,
    		limit: first || last,
    		order: sort.by,
    		direction: last || before ? Direction.PREVIOUS : Direction.NEXT
    	});

    	return paginator.paginate((entity: any) => ({
    		id: entity.message_id,
    		text: entity.message_text,
    		memberId: entity.member_id,
    		updatedAt: entity.updated_at,
    		createdAt: entity.created_at,
    	})
    	);
    }
}

export default MessagesModelResolver;