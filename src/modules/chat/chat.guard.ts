import { CanActivate, SetMetadata, ExecutionContext, Inject, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Privilege as  MemberPrivilege } from '@modules/members/members.dto';
import { Request } from 'express';
import MembersService from '@modules/members/members.service';

export const NeedPrivileges = (...privileges: string[]) => SetMetadata('privileges', privileges);

@Injectable()
export class ChatGruard implements CanActivate {
    public constructor(
        private readonly reflector: Reflector,
        @Inject(MembersService)
        private readonly membersService: MembersService
    ) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const privileges = this.reflector.get<string[]>('privileges', context.getHandler());

        if (!privileges)
            return false;

        const req: Request = context.switchToHttp().getRequest();
        const { id: userId }: any = req.user;
        const { chatId } = req.params;

        const member = await this.membersService.findOne({ userId, chatId, isDeleted: false });

        if (!member)
            throw new ForbiddenException(`You are not is the chat member`);

        if (!privileges.includes(member.privilege.name))
            throw new ForbiddenException(`You dont have permission`);

        return true;
    }
}

export default ChatGruard;