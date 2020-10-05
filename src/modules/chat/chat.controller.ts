import { Controller, Get, Post, Req, UseGuards, Body, Delete, Param } from '@nestjs/common';
import { ChatService, ChatResponse } from '@modules/chat/chat.service';
import AuthGuard from '@modules/auth/auth.guard';
import { Request } from 'express';
import { Type, ChatCreateDTO } from '@modules/chat/chat.dto';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { ChatGruard, NeedPrivileges } from '@modules/chat/chat.guard';
import { Privilege as MemberPrivilege } from '@modules/members/members.dto';

@UseGuards(AuthGuard)
@Controller()
export class ChatController {

    public constructor(private readonly chatService: ChatService) {}

    @ApiTags('/me/chats')
    @ApiBody({ type: () => ChatCreateDTO })
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

    @ApiTags('/me/chats/')
    @UseGuards(ChatGruard)
    @NeedPrivileges(MemberPrivilege.CREATOR)
    @Delete('/me/chats/:chatId')
    public async removeChat(@Param('chatId') chatId: string): Promise<void> { 
        await this.chatService.remove(chatId);
    }
}

export default ChatController;