import { ResolveField, Parent, Context, Info, Resolver } from '@nestjs/graphql';
import { Context as AppContext } from '@schema/utils';
import DataLoader from 'dataloader';
import UsersService from '@schema/resolvers/users/users.service';
import User from '@schema/models/users.model';
import Invitation from '@schema/models/invitation';

@Resolver(() => Invitation)
export class InvitationResolver {

	public constructor(private readonly usersService: UsersService) {}

    @ResolveField('sender', () => User)
	public async getSender(
        @Parent() parent: any,
        @Context() ctx: AppContext, 
        @Info() info
	): Promise<User> {
		const { dataloaders } = ctx;
		let dataloader = dataloaders.get(info.fieldNodes);

		if (!dataloader) {
			dataloader = new DataLoader(async (ids: readonly string[]) => {
				const entities = await this.usersService.findByIds(<string[]>ids);
				return ids.map(id => entities.find(e => e.id === id));
			});

			dataloaders.set(info.fieldNodes, dataloader); 
		}
		return dataloader.load(parent.senderId);
	}

    @ResolveField('recipient', () => User)
    public async getRecipient(
        @Parent() parent: any,
        @Context() ctx: AppContext, 
        @Info() info
    ): Promise<User> {
    	const { dataloaders } = ctx;
    	let dataloader = dataloaders.get(info.fieldNodes);

    	if (!dataloader) {
    		dataloader = new DataLoader(async (ids: readonly string[]) => {
    			const entities = await this.usersService.findByIds(<string[]>ids);
    			return ids.map(id => entities.find(e => e.id === id));
    		});

    		dataloaders.set(info.fieldNodes, dataloader); 
    	}
    	return dataloader.load(parent.recipientId);
    }
}

export default InvitationResolver;