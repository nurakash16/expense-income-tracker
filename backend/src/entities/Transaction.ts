import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './User';
import { Category } from './Category';

export enum TransactionType {
    INCOME = 'income',
    EXPENSE = 'expense'
}

@Entity()
@Index('idx_tx_user_date', ['userId', 'date'])
@Index('idx_tx_user_type', ['userId', 'type'])
@Index('idx_tx_user_category', ['userId', 'categoryId'])
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    userId!: string;

    @ManyToOne(() => User, (user) => user.transactions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column({
        type: 'enum',
        enum: TransactionType
    })
    type!: TransactionType;

    @Column('float')
    amount!: number;

    @Column({ type: 'uuid' })
    categoryId!: string;

    @ManyToOne(() => Category, (category) => category.transactions)
    @JoinColumn({ name: 'categoryId' })
    category!: Category;

    @Column()
    date!: string;

    @Column({ nullable: true })
    note?: string;

    @Column({ nullable: true, default: 'cash' })
    paymentMethod?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
