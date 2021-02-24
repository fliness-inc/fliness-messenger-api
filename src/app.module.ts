import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModulesModule } from './modules/module.module';

@Module({
  imports: [TypeOrmModule.forRoot(), ModulesModule],
})
export class AppModule {}

export default AppModule;
