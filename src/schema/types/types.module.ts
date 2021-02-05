import { Module } from '@nestjs/common';
import UUID from '@schema/types/uuid.type';
import DateTime from '@schema/types/datetime.type';

@Module({
  providers: [UUID, DateTime]
})
export class TypesModule {}

export default TypesModule;
