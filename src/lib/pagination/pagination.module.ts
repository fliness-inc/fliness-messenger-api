import { Module } from '@nestjs/common';
import ScalarsModule from './scalars/scalars.module';
import TypesModule from './types/types.module';

@Module({
  imports: [ScalarsModule, TypesModule]
})
export class PaginationModule {}

export default PaginationModule;
