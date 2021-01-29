import { UseGuards } from '@nestjs/common';
import { Resolver, Field, ResolveField, Parent, Args } from '@nestjs/graphql';
import AuthGuard from '@schema/resolvers/auth/auth.guard';
import Chat from '@schema/models/chats/chats.model';
import MessageEntity from '@database/entities/message';
import { MessageConnection, MessagePaginationInput, MessagePaginationField } from '@schema/models/messages/messages.model.pagination';
import { Direction, Order } from '@src/pagination/enums';
import Sort from '@schema/types/sort';
import { getRepository } from 'typeorm';
import Pagination from '@src/pagination/pagination';
import { MessagesFilter } from '@schema/resolvers/messages/messages.dto';
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
        	@Args('filter', { type: () => MessagesFilter, nullable: true }) filter: MessagesFilter = {}
    ): Promise<MessageConnection> {
        
    	const { after, before, first, last, fields = [] } = pagination;
        
    	const builder = getRepository(MessageEntity).createQueryBuilder('message')
    		.select(Pagination.makeSelectField('message', 'id'))
    		.addSelect(Pagination.makeSelectField('message', 'text'))
    		.addSelect(Pagination.makeSelectField('message', 'member_id'))
    		.addSelect(Pagination.makeSelectField('message', 'updated_at'))
    		.addSelect(Pagination.makeSelectField('message', 'created_at'))
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
				id: entity[Pagination.makeFormatedField('message', 'id')],
				text: entity[Pagination.makeFormatedField('message', 'text')],
				memberId: entity[Pagination.makeFormatedField('message', 'member_id')],
				updatedAt: entity[Pagination.makeFormatedField('message', 'updated_at')],
				createdAt: entity[Pagination.makeFormatedField('message', 'created_at')],
			})
    	);
    }
}

export default MessagesModelResolver;