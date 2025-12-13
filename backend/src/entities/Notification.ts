import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'notifications' })
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ type: 'uuid' })
    userId!: string;

    @Column({ type: 'varchar', length: 64 })
    type!: string; // e.g. 'BUDGET_EXCEEDED', 'LARGE_TXN', 'INFO'

    @Column({ type: 'varchar', length: 200 })
    title!: string;

    @Column({ type: 'text' })
    message!: string;

    @Column({ type: 'jsonb', nullable: true })
    meta?: any; // { transactionId, categoryId, amount, ... }

    @Column({ type: 'timestamptz', nullable: true })
    readAt?: Date | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;
}
