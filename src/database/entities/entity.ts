import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';

export abstract class IEntity {
  @PrimaryGeneratedColumn('uuid')
  public readonly id!: string;

  @CreateDateColumn({ name: 'created_at' })
  public readonly createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  public readonly updatedAt!: Date;

  @Column({ name: 'is_deleted', default: false })
  public readonly isDeleted!: boolean;
}

export default IEntity;
