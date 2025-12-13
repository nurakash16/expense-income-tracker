import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity()
@Index(['userId'], { unique: true })
export class UserSettings {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('uuid')
    userId!: string;

    @Column({ default: 'system' })
    theme!: string;

    @Column({ default: 'BDT' })
    currency!: string;

    @Column({ default: '#6200ee' })
    accentColor!: string;

    @Column('jsonb', { default: { unusualSpending: true, budgetAlerts: true, largeTransactions: true } })
    notificationPrefs!: {
        unusualSpending: boolean;
        budgetAlerts: boolean;
        largeTransactions: boolean;
    };

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
