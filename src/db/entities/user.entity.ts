import { Column, Entity, BeforeInsert, OneToMany, AfterLoad } from 'typeorm';
import { IEntity } from './entity.interface';
import { TokenEntity } from './token.entity';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

@Entity({ name: 'users' })
export class UserEntity extends IEntity {
  @Column({ length: 255 })
  public name: string;

  @Column({ unique: true })
  public email: string;

  @Column({ length: 2048 })
  public password: string;

  @Column({ length: 2048, nullable: true })
  public avatarURL: string;

  @OneToMany(type => TokenEntity, token => token.user)
  public tokens: TokenEntity[];

  @BeforeInsert()
  private encodePassword() {
    const salt = bcrypt.genSaltSync();
    this.password = bcrypt.hashSync(this.password, salt);
  }

  @AfterLoad()
  getAvatarURL() {
    if (!this.avatarURL) return this.avatarURL;

    this.avatarURL =
      `http://${process.env.HOST}:${process.env.PORT}/img/` + this.avatarURL;
  }
}

export default UserEntity;
