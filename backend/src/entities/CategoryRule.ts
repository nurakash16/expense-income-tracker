import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'category_rules' })
export class CategoryRule {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ type: 'uuid' })
    userId!: string;

    @Index()
    @Column({ type: 'uuid' })
    categoryId!: string;

    @Column({ type: 'varchar', length: 200 })
    pattern!: string; // e.g. 'uber', 'netflix', 'walmart' (keyword or regex)

    @Column({ type: 'boolean', default: false })
    isRegex!: boolean;

    @Column({ type: 'int', default: 100 })
    priority!: number;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;
}
