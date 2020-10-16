import { UseGuards } from '@nestjs/common';
import { Resolver } from '@nestjs/graphql';
import AuthGuard from '@schema/resolvers/auth/auth.guard';
import MemberService from '@schema/resolvers/members/members.service';
import { MemberRoleEnum } from '@schema/resolvers/members/members.dto';

@UseGuards(AuthGuard)
@Resolver()
export class MembersResolver {

    public constructor(private readonly memberService: MemberService) {}

    /* @ApiTags('/chats')
    @Post('/chats/:chatId/join')
    @ApiNotFoundResponse({ description: 'The chat was not found.' })
    @ApiBadRequestResponse({ description: 'The property of the request was invalid.' })
    @ApiConflictResponse({ description: 'The operation cannot be performed for some reason.' })
    @ApiUnauthorizedResponse({ description: 'The user is unauthorized.' })
    @ApiHeader({ name: 'Authorization', description: 'The header tag contains the access token.' })
    public async createMember(
        @Req() req: Request, 
        @Param('chatId') chatId: string
    ): Promise<MemberResponse>  {
        const { id: userId }: any = req.user;
        const newMember = await this.memberService.create(userId, chatId, MemberRoleNameEnum.MEMBER);
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
    ): Promise<MemberResponse>  {
        const { id: userId }: any = req.user;
        const newMember = await this.memberService.remove(userId, chatId);
        return this.memberService.prepareEntity(newMember);
    } */
}

export default MembersResolver;