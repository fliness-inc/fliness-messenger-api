import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TokensService } from './tokens.service';
import { TokenEntity } from '@db/entities/token.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const { JWT_SECRET_KEY } = process.env;

@Module({
  imports: [
    JwtModule.register({
      secret: JWT_SECRET_KEY,
    }),
    TypeOrmModule.forFeature([TokenEntity]),
  ],
  providers: [TokensService],
  exports: [TokensService],
})
export class TokensModule {}

export default TokensModule;
