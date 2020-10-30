import { UseGuards } from '@nestjs/common';
import { Resolver, ResolveField, Field, Args, Parent } from '@nestjs/graphql';
import AuthGuard from '@schema/resolvers/auth/auth.guard';
import { MembersFilter } from '@schema/resolvers/members/members.dto';
import Chat from '@schema/models/chats.model';
import Sort from '@schema/types/sort';
import { Direction, Order } from '@src/pagination/enums';
import CurrentUser from '@schema/resolvers/auth/current-user';
import User from '@schema/models/users.model';
import MemberConnection, { MemberPaginationField, MemberPaginationInput } from '@schema/models/members.pagination';
import { InjectRepository } from '@nestjs/typeorm';
import Member from '@database/entities/member';
import { Repository } from 'typeorm';
import * as Pagination from '@src/pagination/paginator';

@UseGuards(AuthGuard)
@Resolver(of => Chat)
export class MembersQueryResolver {

    public constructor(
        @InjectRepository(Member)
        private readonly membersRespository: Repository<Member>,
    ) {}

    @Field(type => MemberConnection, { name: 'members' })
    public readonly members: MemberConnection;

    @ResolveField(type => MemberConnection, { name: 'members' })
    public async getMembers(
        @CurrentUser() user: User,
        @Parent() chat: Chat,
        @Args('pagination', { type: () => MemberPaginationInput, nullable: true }) pagination: MemberPaginationInput = {},
        @Args('sort', { type: () => Sort, nullable: true }) sort: Sort = { by: Order.ASC },
        @Args('filter', { type: () => MembersFilter, nullable: true }) filter: MembersFilter = <any>{}
    ): Promise<MemberConnection> {

        const { after, before, first, last, fields = [] } = pagination;
        
        const builder = this.membersRespository.createQueryBuilder('member')
            .select('member.id')
            .addSelect('member.chat_id')
            .addSelect('member.user_id')
            .addSelect('member.updated_at')
            .addSelect('member.created_at')
            .addSelect('role.name')
            .leftJoin('member.role', 'role')
            .where('member.is_deleted = :isDeleted', { isDeleted: false })
            .andWhere('member.chat_id = :chatId', { chatId: chat.id });

        if (filter.role) builder.andWhere('role.name = :role', filter);
        else if (filter.id) builder.andWhere('member.id = :id', filter);

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
                id: entity.member_id,
                chatId: entity.chat_id,
                userId: entity.user_id,
                updatedAt: entity.updated_at,
                createdAt: entity.created_at,
                role: entity.role_name
            })
        );
    }
}

export default MembersQueryResolver;