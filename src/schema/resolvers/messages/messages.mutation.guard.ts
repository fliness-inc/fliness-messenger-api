import { CanActivate, SetMetadata, ExecutionContext, Inject, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';
import MembersService from '@schema/resolvers/members/members.service';
import ChatsService from '@schema/resolvers/chats/chats.service';
import { NotFoundError } from '@src/errors';
import { getRepository, In } from 'typeorm';
import MemberRole from '@database/entities/member-role';

export { MemberRoleEnum } from '@schema/resolvers/members/members.dto';
export const ChatRoles = (...roles: string[]) => SetMetadata('roles', roles);

@Injectable()
export class MessagesCreationGruard implements CanActivate {
	public constructor(
        private readonly reflector: Reflector,
        @Inject(MembersService)
        private readonly membersService: MembersService,
        @Inject(ChatsService)
        private readonly chatsService: ChatsService
	) {}

	public async canActivate(context: ExecutionContext): Promise<boolean> {

		const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
		const roles = await getRepository(MemberRole).find({ 
			where: { 
				name: In(requiredRoles) 
			} 
		});

		if (!roles.length)
			return true;

		const ctx = GqlExecutionContext.create(context);
		const req: Request = ctx.getContext().req;
		const { id: userId }: any = req.user;
		const { payload: { chatId } } = ctx.getArgs();

		const chat = await this.chatsService.findOne({ where: { id: chatId } });

		if (!chat)
			throw new NotFoundError(`The chat was not found with the id: ${chatId}`);

		const member = await this.membersService.findOne({ where: { userId, chatId, isDeleted: false }});

		if (!member)
			throw new ForbiddenException(`You are not is the chat member`);

		if (!roles.some(v => v.weight <= member.role.weight))
			throw new ForbiddenException(`You dont have permission`);

		return true;
	}
}

export default MessagesGruard;