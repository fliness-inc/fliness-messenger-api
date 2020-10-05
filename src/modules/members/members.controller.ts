import { Delete, Get, Controller, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import AuthGuard from '@modules/auth/auth.guard';
import { Request } from 'express';
import MemberService from '@modules/members/members.service';
import { MemberRespomse, Privilege } from '@modules/members/members.dto';

@UseGuards(AuthGuard)
@Controller()
export class MembersController {

    public constructor(private readonly memberService: MemberService) {}

    @Post('/chats/:chatId/join')
    public async createMember(
        @Req() req: Request, 
        @Param('chatId') chatId: string
    ): Promise<MemberRespomse>  {
        const { id: userId }: any = req.user;
        const newMember = await this.memberService.create(userId, chatId, Privilege.MEMBER);
        return this.memberService.prepareEntity(newMember);
    }

    @Delete('/me/chats/:chatId/leave')
    public async removeMember(
        @Req() req: Request, 
        @Param('chatId') chatId: string
    ): Promise<MemberRespomse>  {
        const { id: userId }: any = req.user;
        const newMember = await this.memberService.remove(userId, chatId);
        return this.memberService.prepareEntity(newMember);
    }
}

export default MembersController;