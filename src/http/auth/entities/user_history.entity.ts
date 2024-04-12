import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Unique,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class UserHistory {
  @PrimaryGeneratedColumn({ unsigned: true })
  id?: number;

  @Column()
  userId?: number;

  @Column()
  accessToken?: string;

  @Column()
  refreshToken?: string;

  @Column()
  createdAt?: string;

  @Column()
  updateAt?: string;

  @ManyToOne(() => User, (user) => user.id)
  user?: User;
}
