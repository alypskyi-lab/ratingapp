import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Match } from './match.entity';

@Entity('match_participants')
@Index('idx_mp_match', ['matchId'])
@Index('idx_mp_player', ['playerId'])
@Index('idx_mp_player', ['playerId'])
export class MatchParticipant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  matchId!: string;

  @ManyToOne(() => Match, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'matchId' })
  match!: Match;

  @Column('int')
  team!: number;

  @Column('uuid')
  playerId!: string;

  @Column('int', { nullable: true })
  score?: number | null;

  @CreateDateColumn({ precision: 3 })
  createdAt!: Date;
}
