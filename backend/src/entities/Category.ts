import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './User';
import { Transaction } from './Transaction';

export enum CategoryType {
    INCOME = 'income',
    EXPENSE = 'expense',
    BOTH = 'both'
}

@Entity()
export class Category {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    userId!: string;

    @ManyToOne(() => User, (user) => user.categories, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column()
    name!: string;

    @Column({
        type: 'enum',
        enum: CategoryType,
        default: CategoryType.EXPENSE
    })
    type!: CategoryType;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, nullable: true })
    budget?: number;

    @OneToMany(() => Transaction, (transaction) => transaction.category)
    transactions!: Transaction[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
