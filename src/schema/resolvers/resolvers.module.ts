import { Module } from '@nestjs/common';
import UsersModule from '@schema/resolvers/users/users.module';
import AuthModule from '@schema/resolvers/auth/auth.module';
import TokensModule from '@schema/resolvers/tokens/tokens.module';

@Module({
    imports: [
        UsersModule,
        AuthModule,
        TokensModule
    ]
})
export class ResolversModule {}

export default ResolversModule;