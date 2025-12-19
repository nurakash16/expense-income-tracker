"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitCoreTables1699999999999 = void 0;
class InitCoreTables1699999999999 {
    constructor() {
        this.name = 'InitCoreTables1699999999999';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'category_type_enum') THEN
                    CREATE TYPE "public"."category_type_enum" AS ENUM ('income', 'expense', 'both');
                END IF;
            END$$;
        `);
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type_enum') THEN
                    CREATE TYPE "public"."transaction_type_enum" AS ENUM ('income', 'expense');
                END IF;
            END$$;
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "passwordHash" character varying NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_users_email" UNIQUE ("email")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "category" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "name" character varying NOT NULL,
                "type" "public"."category_type_enum" NOT NULL DEFAULT 'expense',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_category_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_category_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_category_user" ON "category" ("userId");`);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "transaction" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "type" "public"."transaction_type_enum" NOT NULL,
                "amount" double precision NOT NULL,
                "categoryId" uuid NOT NULL,
                "date" character varying NOT NULL,
                "note" character varying,
                "paymentMethod" character varying DEFAULT 'cash',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_transaction_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_transaction_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_transaction_category" FOREIGN KEY ("categoryId") REFERENCES "category"("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_tx_user_date" ON "transaction" ("userId", "date");`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_tx_user_type" ON "transaction" ("userId", "type");`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_tx_user_category" ON "transaction" ("userId", "categoryId");`);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "weekly_rollup" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "weekStart" character varying NOT NULL,
                "incomeTotal" double precision NOT NULL DEFAULT 0,
                "expenseTotal" double precision NOT NULL DEFAULT 0,
                "balance" double precision NOT NULL DEFAULT 0,
                CONSTRAINT "PK_weekly_rollup_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_rollup_user_week" ON "weekly_rollup" ("userId", "weekStart")
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_rollup_user_week"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "weekly_rollup"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_tx_user_category"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_tx_user_type"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_tx_user_date"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "transaction"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_category_user"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "category"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."transaction_type_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."category_type_enum"`);
    }
}
exports.InitCoreTables1699999999999 = InitCoreTables1699999999999;
