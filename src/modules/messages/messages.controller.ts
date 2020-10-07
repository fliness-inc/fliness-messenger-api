import { Controller, Post, Param, Req, Body, UseGuards, Delete } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { MessagesService, MessageResponse } from '@modules/messages/messages.service';
import { CreateMessageDTO } from '@modules/messages/messages.dto';
import { ChatGruard, ChatRoles, MemberRoleNameEnum } from '@modules/chats/chats.guard';
import AuthGuard from '@modules/auth/auth.guard';

@UseGuards(AuthGuard)
@ApiUnauthorizedResponse({ description: 'The user is unauthorized.' })
@Controller()
export class MessagesController {

    public constructor(private readonly messagesService: MessagesService) {}

    @ApiTags('/me/chats/messages')
    @ApiBody({ type: () =>  CreateMessageDTO})
    @ApiCreatedResponse({ description: 'The message was successfully created.' })
    @ApiBadRequestResponse({ description: 'The property of the request was invalid.' })
    @ApiForbiddenResponse({ description: 'You need some privilege to performed the operation.' })
    @ApiNotFoundResponse({ description: 'The entity was not found.' })
    @UseGuards(ChatGruard)
    @ChatRoles(MemberRoleNameEnum.MEMBER)
    @Post('/me/chats/:chatId/messages')
    public async sendMessage(
        @Req() req: Request,
        @Param('chatId') chatId: string,
        @Body() payload: CreateMessageDTO
    ): Promise<MessageResponse> {
        const { id: userId }: any = req.user; 

        return this.messagesService.prepareEntity(
            await this.messagesService.create(userId, chatId, payload)
        );
    }

    @ApiTags('/me/chats/messages')
    @ApiOkResponse({ description: 'The operation was successfully performed.' })
    @ApiBadRequestResponse({ description: 'The property of the request was invalid.' })
    @ApiForbiddenResponse({ description: 'You need some privilege to performed the operation.' })
    @ApiNotFoundResponse({ description: 'The entity was not found.' })
    @UseGuards(ChatGruard)
    @ChatRoles(MemberRoleNameEnum.MEMBER)
    @Delete('/me/chats/:chatId/messages/:messageId')
    public async removeMessage(
        @Req() req: Request,
        @Param('messageId') messageId: string
    ): Promise<MessageResponse> {
        const { id: userId }: any = req.user; 

        return this.messagesService.prepareEntity(
            await this.messagesService.remove(userId, messageId)
        );
    }
}

export default MessagesController;