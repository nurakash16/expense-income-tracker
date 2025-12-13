import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, Unique } from 'typeorm';

@Entity({ name: 'monthly_rollups' })
@Unique(['userId', 'month', 'categoryId']) // One record per user per category per month
export class MonthlyRollup {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ type: 'uuid' })
    userId!: string;

    @Column({ type: 'varchar', length: 10 }) // YYYY-MM-01
    month!: string;

    @Index()
    @Column({ type: 'uuid' })
    categoryId!: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    totalIncome!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    totalExpense!: number;

    @Column({ type: 'int', default: 0 })
    txCount!: number;

    @CreateDateColumn({ type: 'timestamptz' })
    updatedAt!: Date;
}
