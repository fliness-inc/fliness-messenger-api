import { Module } from '@nestjs/common';
import MeQueryResolver from '@schema/resolvers/me/me.query.resolver';
import MeMutationResolver from '@schema/resolvers/me/me.mutation.resolver';
import UsersModule from '@schema/resolvers/users/users.module';

@Module({
    imports: [UsersModule],
    providers: [MeQueryResolver, MeMutationResolver]
})
export class MeModule {}

export default MeModule;