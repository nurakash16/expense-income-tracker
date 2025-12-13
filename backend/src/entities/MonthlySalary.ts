import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity()
@Index(['userId', 'month'], { unique: true })
export class MonthlySalary {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('uuid')
    userId!: string;

    @Column()
    month!: string; // Format: YYYY-MM

    @Column('decimal', { precision: 12, scale: 2 })
    amount!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
