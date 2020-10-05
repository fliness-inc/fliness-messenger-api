import { Delete, Get, Controller, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import AuthGuard from '@modules/auth/auth.guard';
import { Request } from 'express';
import MemberService from '@modules/members/members.service';
import { MemberRespomse, Privilege } from '@modules/members/members.dto';
import { ApiBadRequestResponse, ApiConflictResponse, ApiHeader, ApiNotFoundResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';

@UseGuards(AuthGuard)
@Controller()
export class MembersController {

    public constructor(private readonly memberService: MemberService) {}

    @ApiTags('/chats')
    @Post('/chats/:chatId/join')
    @ApiNotFoundResponse({ description: 'The chat was not found.' })
    @ApiBadRequestResponse({ description: 'The property of the request was invalid.' })
    @ApiConflictResponse({ description: 'The operation cannot be performed for some reason.' })
    @ApiUnauthorizedResponse({ description: 'The user is unauthorized.' })
    @ApiHeader({ name: 'Authorization', description: 'The header tag contains the access token.' })
    public async createMember(
        @Req() req: Request, 
        @Param('chatId') chatId: string
    ): Promise<MemberRespomse>  {
        const { id: userId }: any = req.user;
        const newMember = await this.memberService.create(userId, chatId, Privilege.MEMBER);
        return this.memberService.prepareEntity(newMember);
    }

    @ApiTags('/me/chats')
    @Delete('/me/chats/:chatId/leave')
    @ApiNotFoundResponse({ description: 'The chat was not found.' })
    @ApiBadRequestResponse({ description: 'The property of the request was invalid.' })
    @ApiUnauthorizedResponse({ description: 'The user is unauthorized.' })
    @ApiHeader({ name: 'Authorization', description: 'The header tag contains the access token.' })
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