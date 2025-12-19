import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDisplayNameToUsers1700000000004 implements MigrationInterface {
    name = 'AddDisplayNameToUsers1700000000004';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('users', new TableColumn({
            name: 'displayName',
            type: 'varchar',
            isNullable: true,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('users', 'displayName');
    }
}
