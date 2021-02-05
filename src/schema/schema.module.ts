import { Module } from '@nestjs/common';
import TypesModule from '@schema/types/types.module';
import ModelsModule from '@schema/models/models.module';

@Module({
  imports: [TypesModule, ModelsModule]
})
export class SchemaModule {}

export default SchemaModule;
