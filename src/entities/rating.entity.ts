import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Player } from '@entities/player.entity';

@Entity('ratings')
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Player, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player!: Player;

  @Column('float', { default: 25 })
  mu!: number;

  @Column('float', { default: 8.333 })
  sigma!: number;

  @Column('float', { default: 0 })
  exposure!: number;

  @UpdateDateColumn({ precision: 3 })
  updatedAt!: Date;
}
