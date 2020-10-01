import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FriendsModule } from '@modules/friends/friends.module';
import { AuthModule } from '@modules/auth/auth.module';
import UsersModule from '@modules/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(), 
    UsersModule,
    AuthModule, 
    FriendsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
