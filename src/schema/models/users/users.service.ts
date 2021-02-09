import { Injectable } from '@nestjs/common';
import { FindManyOptions, FindOneOptions, DeepPartial } from 'typeorm';
import { User } from '@db/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  public constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  public async find(options?: FindManyOptions<User>): Promise<User[]> {
    return this.userRepository.find(options);
  }

  public async findOne(
    options?: FindOneOptions<User>
  ): Promise<User | undefined> {
    return this.userRepository.findOne(options);
  }

  public async findByIds(
    ids: string[],
    options?: FindManyOptions<User>
  ): Promise<(User | undefined)[]> {
    const users = await this.userRepository.findByIds(ids, options);
    return ids.map(id => users.find(u => u.id === id));
  }

  public async create(entity: DeepPartial<User>): Promise<User> {
    if (await this.userRepository.findOne({ email: entity.email }))
      throw new Error(`The user with that email address already signed up`);

    return this.userRepository.save(this.userRepository.create(entity));
  }
}

export default UsersService;
