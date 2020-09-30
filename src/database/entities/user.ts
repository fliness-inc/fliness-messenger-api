import { Column, Entity, BeforeInsert } from 'typeorm';
import IEntity from '@database/entities/entity';
import bcrypt from 'bcrypt';

@Entity({ name: 'users' })
export class User extends IEntity {
  @Column({ length: 255 })
  public name: string;

  @Column({ unique: true })
  public email: string;

  @Column({ length: 2048 })
  public password: string;

  @BeforeInsert()
  private encodePassword() {
    const salt = bcrypt.genSaltSync();
    this.password = bcrypt.hashSync(this.password, salt);
  }
}

export default User;
