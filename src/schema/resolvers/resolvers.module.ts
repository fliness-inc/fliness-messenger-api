import { Module } from '@nestjs/common';
import UsersModule from '@schema/resolvers/users/users.module';
import AuthModule from '@schema/resolvers/auth/auth.module';
import TokensModule from '@schema/resolvers/tokens/tokens.module';
import FriendsModule from '@schema/resolvers/friends/friends.module';
import InvitationsModule from '@schema/resolvers/invitations/invitations.module';
import MeModule from '@schema/resolvers/me/me.module';

@Module({
    imports: [
        UsersModule,
        AuthModule,
        TokensModule,
        FriendsModule,
        InvitationsModule,
        MeModule
    ]
})
export class ResolversModule {}

export default ResolversModule;