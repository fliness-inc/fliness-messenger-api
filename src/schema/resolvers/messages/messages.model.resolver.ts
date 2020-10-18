import { UseGuards } from '@nestjs/common';
import { Resolver, Field, ResolveField, Parent } from '@nestjs/graphql';
import MessagesService from '@schema/resolvers/messages/messages.service';
import { ChatGruard, ChatRoles, MemberRoleEnum } from '@schema/resolvers/chats/chats.guard';
import AuthGuard from '@schema/resolvers/auth/auth.guard';
import Chat from '@schema/models/chats.model';
import Message from '@schema/models/messages.model';

@UseGuards(AuthGuard, ChatGruard)
@ChatRoles(MemberRoleEnum.MEMBER)
@Resolver(of => Chat)
export class MessagesModelResolver {

    public constructor(private readonly messagesService: MessagesService) {}

    @Field(type => [Message], { name: 'messages' })
    public readonly messages: Message[];

    @ResolveField(type => [Message], { name: 'messages' })
    public async getMessages(@Parent() chat: Chat  ): Promise<Message[]> {
        const messages = await this.messagesService.find(alias => ({
            where: {
                member: {
                    chatId: chat.id 
                } 
            },
            join: {
                alias,
                leftJoinAndSelect: {
                    member: `${alias}.member`
                }
            }
        }));
        
        return messages.map(m => ({
            id: m.id,
            text: m.text,
            memberId: m.memberId,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt
        }));
    }
}

export default MessagesModelResolver;