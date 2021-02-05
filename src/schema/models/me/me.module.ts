import { Module } from '@nestjs/common';
import MeQueryResolver from '@schema/models/me/me.query.resolver';
import MeMutationResolver from '@schema/models/me/me.mutation.resolver';
import UsersModule from '@schema/models/users/users.module';

@Module({
  imports: [UsersModule],
  providers: [MeQueryResolver, MeMutationResolver]
})
export class MeModule {}

export default MeModule;
