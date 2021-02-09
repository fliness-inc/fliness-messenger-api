import {
  Column,
  Entity,
  BeforeInsert,
  OneToMany,
  JoinColumn,
  OneToOne
} from 'typeorm';
import IEntity from './entity.interface';
import bcrypt from 'bcryptjs';
import TokenEnity from './token.entity';

@Entity({ name: 'users' })
export class User extends IEntity {
  @Column({ length: 255 })
  public name: string;

  @Column({ unique: true })
  public email: string;

  @Column({ length: 2048 })
  public password: string;

  @Column({ length: 2048, nullable: true })
  public avatarURL: string;

  @OneToMany(
    type => TokenEnity,
    token => token.user
  )
  public tokens: TokenEnity[];

  @BeforeInsert()
  private encodePassword() {
    const salt = bcrypt.genSaltSync();
    this.password = bcrypt.hashSync(this.password, salt);
  }
}

export default User;
