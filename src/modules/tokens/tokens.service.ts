import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenEntity } from '~/db/entities/token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as uuid from 'uuid';
import { Repository, FindManyOptions, FindOneOptions } from 'typeorm';

export class Tokens {
  public accessToken: string;
  public refreshToken: string;
}

export const MAX_AGE: number = 1000 * 60 * 60 * 24 * 60;

@Injectable()
export class TokensService {
  public constructor(
    @InjectRepository(TokenEntity)
    private readonly tokensRespository: Repository<TokenEntity>,
    private readonly jwtService: JwtService
  ) {}

  public async create(userId: string, userAgent: string): Promise<Tokens> {
    const tokens = this.generate(userId);

    await this.expireToken(userId, userAgent);

    await this.tokensRespository.save(
      this.tokensRespository.create({
        userId,
        token: tokens.refreshToken,
        userAgent,
        expiresAt: new Date(Date.now() + MAX_AGE),
      })
    );

    return tokens;
  }

  private async expireToken(userId: string, userAgent: string): Promise<void> {
    const now = new Date(Date.now());
    await this.tokensRespository
      .createQueryBuilder()
      .update(TokenEntity)
      .set({ expiresAt: now })
      .where('userId = :userId', { userId })
      .andWhere('user_agent = :userAgent', { userAgent })
      .andWhere('expires_at > :now', { now })
      .execute();
  }

  private generate(userId: string): Tokens {
    return {
      accessToken: this.jwtService.sign({ id: userId }, { expiresIn: '15min' }),
      refreshToken: uuid.v4(),
    };
  }

  public async refresh(
    refreshToken: string,
    userAgent: string
  ): Promise<Tokens> {
    const token = await this.tokensRespository
      .createQueryBuilder('t')
      .where('t.token = :token', { token: refreshToken })
      .andWhere('t.user_agent = :userAgent', { userAgent })
      .orderBy('t.expires_at', 'DESC')
      .getOne();

    if (!token) throw new UnauthorizedException('The refresh token is invalid');

    if (token.expiresAt.getTime() < Date.now())
      throw new UnauthorizedException('The refresh token is expired');

    const newTokens = this.generate(token.userId);

    await this.expireToken(token.userId, token.userAgent);

    await this.tokensRespository.save({
      ...token,
      token: newTokens.refreshToken,
      expiresAt: new Date(Date.now() + MAX_AGE),
    });

    return newTokens;
  }

  public async delete(refreshToken: string, userAgent: string): Promise<void> {
    const token = await this.tokensRespository
      .createQueryBuilder('t')
      .where('t.token = :token', { token: refreshToken })
      .andWhere('t.user_agent = :userAgent', { userAgent })
      .orderBy('t.expires_at', 'DESC')
      .getOne();

    if (!token) throw new UnauthorizedException('The refresh token is invalid');

    if (token.expiresAt.getTime() < Date.now())
      throw new UnauthorizedException('The refresh token is expired');

    await this.expireToken(token.userId, token.userAgent);
  }

  public async find(
    options?: FindManyOptions<TokenEntity>
  ): Promise<TokenEntity[]> {
    return this.tokensRespository.find(options);
  }

  public async findOne(
    options?: FindOneOptions<TokenEntity>
  ): Promise<TokenEntity> {
    return this.tokensRespository.findOne(options);
  }
}

export default TokensService;
