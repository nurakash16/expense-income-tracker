import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddBudgetToCategory1700000000002 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("category", new TableColumn({
            name: "budget",
            type: "decimal",
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: true
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("category", "budget");
    }

}
