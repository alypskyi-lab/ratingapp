import { Column, CreateDateColumn, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Rating } from '@app/processors/rating/rating.entity';

@Entity('players')
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  username!: string;

  @CreateDateColumn({ precision: 3 })
  createdAt!: Date;

  @OneToOne(() => Rating, (r) => r.player)
  rating?: Rating;
}
