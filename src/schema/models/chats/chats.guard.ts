import {
  CanActivate,
  SetMetadata,
  ExecutionContext,
  Inject,
  ForbiddenException,
  Injectable
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';
import MembersService from '@schema/models/members/members.service';
import ChatsService from '@schema/models/chats/chats.service';
import { NotFoundError } from '@src/errors';
import { getRepository, In } from 'typeorm';
import MemberRoleEntity from '@db/entities/member-role.entity';

export { MemberRoleEnum } from '@schema/models/members/members.dto';
export const ChatRoles = (...roles: string[]) => SetMetadata('roles', roles);

@Injectable()
export class ChatGruard implements CanActivate {
  public constructor(
    private readonly reflector: Reflector,
    @Inject(MembersService)
    private readonly membersService: MembersService,
    @Inject(ChatsService)
    private readonly chatsService: ChatsService
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles =
      this.reflector.get<string[]>('roles', context.getHandler()) || [];
    const roles = await getRepository(MemberRoleEntity).find({
      where: {
        name: In(requiredRoles)
      }
    });

    if (!roles.length) return true;

    const ctx = GqlExecutionContext.create(context);
    const req: Request = ctx.getContext().req;
    const { id: userId }: any = req.user;
    const { chatId } = ctx.getArgs();

    const chat = await this.chatsService.findOne({ where: { id: chatId } });

    if (!chat)
      throw new NotFoundError(`The chat was not found with the id: ${chatId}`);

    const member = await this.membersService.findOne({
      where: { userId, chatId, isDeleted: false }
    });

    if (!member) throw new ForbiddenException(`You are not is the chat member`);

    if (!roles.some(v => v.weight <= member.role.weight))
      throw new ForbiddenException(`You dont have permission`);

    return true;
  }
}

export default ChatGruard;
