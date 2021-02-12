import { Injectable } from '@nestjs/common';
import { FindManyOptions, FindOneOptions, DeepPartial } from 'typeorm';
import { User as UserEntity } from '@db/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  public constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>
  ) {}

  public async find(
    options?: FindManyOptions<UserEntity>
  ): Promise<UserEntity[]> {
    return this.userRepository.find(options);
  }

  public async findOne(
    options?: FindOneOptions<UserEntity>
  ): Promise<UserEntity | undefined> {
    return this.userRepository.findOne(options);
  }

  public async findByIds(
    ids: string[],
    options?: FindManyOptions<UserEntity>
  ): Promise<(UserEntity | undefined)[]> {
    const users = await this.userRepository.findByIds(ids, options);
    return ids.map(id => users.find(u => u.id === id));
  }

  public async create(entity: DeepPartial<UserEntity>): Promise<UserEntity> {
    if (await this.userRepository.findOne({ email: entity.email }))
      throw new Error(`The user with that email address already created`);

    return this.userRepository.save(this.userRepository.create(entity));
  }
}

export default UsersService;
