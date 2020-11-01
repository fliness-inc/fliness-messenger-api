import { Module } from '@nestjs/common';
import TypesModule from '@schema/types/types.module';
import ResolversModule from '@schema/resolvers/resolvers.module';

@Module({
	imports: [TypesModule, ResolversModule],
})
export class SchemaModule {}

export default SchemaModule;