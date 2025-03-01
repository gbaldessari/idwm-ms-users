import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn({ unsigned: true })
  id?: number;

  @Column({ nullable: false })
  name?: string;

  @Column({ nullable: false })
  lastName?: string;

  @Column({ unique: true })
  email?: string;

  @Column({ nullable: false })
  password?: string;

  @Column({ nullable: false })
  birthdate?: string;
  
  @Column({ default: true })
  active?: boolean;
  
  @Column({default: 3})
  isAdmin?: number;

  @Column({ type: 'varchar', nullable: true })
  resetPasswordToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpires?: Date;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt?: string;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updateAt?: string;
}
