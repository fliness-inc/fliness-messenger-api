import { Controller, Get, Post, Req, UseGuards, Body, Delete, Param } from '@nestjs/common';
import { ChatsService, ChatResponse } from '@modules/chats/chats.service';
import AuthGuard from '@modules/auth/auth.guard';
import { Request } from 'express';
import { ChatTypeEnum, ChatCreateDTO } from '@modules/chats/chats.dto';
import { ApiBadGatewayResponse, ApiBody, ApiConflictResponse, ApiCreatedResponse, ApiTags, ApiOkResponse, ApiForbiddenResponse, ApiBadRequestResponse, ApiNotFoundResponse, ApiUnauthorizedResponse, ApiHeader } from '@nestjs/swagger';
import { ChatGruard, ChatRoles } from '@modules/chats/chats.guard';
import { MemberRoleNameEnum } from '@modules/members/members.dto';

@UseGuards(AuthGuard)
@Controller()
export class ChatsController {

    public constructor(private readonly chatService: ChatsService) {}

    @ApiTags('/me/chats')
    @ApiBody({ type: () => ChatCreateDTO })
    @ApiCreatedResponse({ description: 'The chat was successfully created.' })
    @ApiBadRequestResponse({ description: 'The property of the request was invalid.' })
    @ApiConflictResponse({ description: 'The operation cannot be performed for some reason.' })
    @ApiUnauthorizedResponse({ description: 'The user is unauthorized.' })
    @ApiHeader({ name: 'Authorization', description: 'The header tag contains the access token.' })
    @Post('/me/chats')
    public async createChat(
        @Req() req: Request,
        @Body() {  title, description, type, userIds }: ChatCreateDTO
    ): Promise<ChatResponse> { 
        const { id: userId }: any = req.user;
        const chat = await this.chatService.create(userId, type, {
            title,
            description,
            userIds
        });
        return this.chatService.prepareEntity(chat);
    }

    @ApiTags('/me/chats')
    @ApiOkResponse({ description: 'The operation was successfully performed.' })
    @ApiNotFoundResponse({ description: 'The chat was not found.' })
    @ApiForbiddenResponse({ description: 'You need some privilege to performed the operation.' })
    @ApiUnauthorizedResponse({ description: 'The user is unauthorized.' })
    @ApiHeader({ name: 'Authorization', description: 'The header tag contains the access token.' })
    @UseGuards(ChatGruard)
    @ChatRoles(MemberRoleNameEnum.CREATOR)
    @Delete('/me/chats/:chatId')
    public async removeChat(@Param('chatId') chatId: string): Promise<void> { 
        await this.chatService.remove(chatId);
    }
}

export default ChatsController;