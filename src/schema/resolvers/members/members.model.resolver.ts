import { UseGuards } from '@nestjs/common';
import { Resolver, ResolveField, Parent, Info, Context } from '@nestjs/graphql';
import AuthGuard from '@schema/resolvers/auth/auth.guard';
import Chat from '@schema/models/chats.model';
import User from '@schema/models/users.model';
import { InjectRepository } from '@nestjs/typeorm';
import MemberEntity from '@database/entities/member';
import MemberModel from '@schema/models/members.model';
import { Context as AppContext } from '@src/schema/utils';
import DataLoader from 'dataloader';
import UsersService from '@schema/resolvers/users/users.service';
import ChatsService from '@schema/resolvers/chats/chats.service';

@UseGuards(AuthGuard)
@Resolver(of => MemberModel)
export class MembersModelResolver {

    public constructor(
        private readonly chatsService: ChatsService,
        private readonly usersService: UsersService
    ) {}

    @ResolveField(type => User, { name: 'user' })
    public async getUser(
        @Parent() parent: any,
        @Context() ctx: AppContext, 
        @Info() info)
    : Promise<User> {
        const { dataloaders } = ctx;
        let dataloader = dataloaders.get(info.fieldNodes);

        if (!dataloader) {
            dataloader = new DataLoader(async (ids: readonly string[]) => {
                const entities = await this.usersService.findByIds(<string[]>ids);
                return ids.map(id => entities.find(e => e.id === id));
            });

            dataloaders.set(info.fieldNodes, dataloader); 
        }
        return dataloader.load(parent.userId);
    }   
    
    @ResolveField(type => Chat, { name: 'chat' })
    public async getChat(
        @Parent() parent: any,
        @Context() ctx: AppContext, 
        @Info() info)
    : Promise<Chat> {
        const { dataloaders } = ctx;
        let dataloader = dataloaders.get(info.fieldNodes);

        if (!dataloader) {
            dataloader = new DataLoader(async (ids: readonly string[]) => {
                const entities = await this.chatsService.findByIds(<string[]>ids);
                return ids.map(id => entities.find(e => e.id === id));
            });

            dataloaders.set(info.fieldNodes, dataloader); 
        }
        return dataloader.load(parent.chatId);
    }
}

export default MembersModelResolver;