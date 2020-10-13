import { Module } from '@nestjs/common';
import UsersResolver from '@schema/resolvers/users';

@Module({
    providers: [UsersResolver]
})
export class ResolversModule {}

export default ResolversModule;