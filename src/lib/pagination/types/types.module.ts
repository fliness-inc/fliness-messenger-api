import { Module } from '@nestjs/common';
import Sort from './sort.type';

@Module({
  providers: [Sort]
})
export class TypesModule {}

export default TypesModule;
