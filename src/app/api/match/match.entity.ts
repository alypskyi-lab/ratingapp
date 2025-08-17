import { Entity, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('matches')
export class Match {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @CreateDateColumn()
    createdAt!: Date;
}