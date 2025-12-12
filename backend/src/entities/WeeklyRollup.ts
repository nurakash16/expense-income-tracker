import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity()
@Index('idx_rollup_user_week', ['userId', 'weekStart'], { unique: true })
export class WeeklyRollup {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid' }) userId!: string;
  @Column() weekStart!: string; // YYYY-MM-DD (Monday)
  @Column('float', { default: 0 }) incomeTotal!: number;
  @Column('float', { default: 0 }) expenseTotal!: number;
  @Column('float', { default: 0 }) balance!: number;
}

