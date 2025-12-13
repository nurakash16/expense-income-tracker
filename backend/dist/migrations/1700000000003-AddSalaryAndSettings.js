"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddSalaryAndSettings1700000000003 = void 0;
class AddSalaryAndSettings1700000000003 {
    constructor() {
        this.name = 'AddSalaryAndSettings1700000000003';
    }
    async up(queryRunner) {
        await queryRunner.query(`
            CREATE TABLE "monthly_salary" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "month" character varying NOT NULL,
                "amount" numeric(12,2) NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_monthly_salary_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_monthly_salary_user_month" ON "monthly_salary" ("userId", "month")
        `);
        await queryRunner.query(`
            CREATE TABLE "user_settings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "theme" character varying NOT NULL DEFAULT 'system',
                "currency" character varying NOT NULL DEFAULT 'BDT',
                "accentColor" character varying NOT NULL DEFAULT '#6200ee',
                "notificationPrefs" jsonb NOT NULL DEFAULT '{"unusualSpending": true, "budgetAlerts": true, "largeTransactions": true}',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_settings_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_user_settings_user" ON "user_settings" ("userId")
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_user_settings_user"`);
        await queryRunner.query(`DROP TABLE "user_settings"`);
        await queryRunner.query(`DROP INDEX "IDX_monthly_salary_user_month"`);
        await queryRunner.query(`DROP TABLE "monthly_salary"`);
    }
}
exports.AddSalaryAndSettings1700000000003 = AddSalaryAndSettings1700000000003;
