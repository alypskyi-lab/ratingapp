import { Player } from '@app/api/player/player.entity';
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

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

  @UpdateDateColumn({ precision: 3 })
  updatedAt!: Date;
}
