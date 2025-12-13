"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonthlyRollups1700000000001 = void 0;
class MonthlyRollups1700000000001 {
    constructor() {
        this.name = 'MonthlyRollups1700000000001';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      create table if not exists public.monthly_rollups (
        id uuid primary key default gen_random_uuid(),
        "userId" uuid not null,
        month varchar(10) not null,
        "categoryId" uuid not null,
        "totalIncome" decimal(12, 2) not null default 0,
        "totalExpense" decimal(12, 2) not null default 0,
        "txCount" int not null default 0,
        "updatedAt" timestamptz not null default now(),
        constraint uq_monthly_rollup unique ("userId", month, "categoryId")
      );
    `);
        await queryRunner.query(`
      create index if not exists idx_monthly_rollups_user
      on public.monthly_rollups ("userId");
    `);
        await queryRunner.query(`
      create index if not exists idx_monthly_rollups_category
      on public.monthly_rollups ("userId", "categoryId");
    `);
        await queryRunner.query(`
      create index if not exists idx_monthly_rollups_month
      on public.monthly_rollups ("userId", month);
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`drop table if exists public.monthly_rollups;`);
    }
}
exports.MonthlyRollups1700000000001 = MonthlyRollups1700000000001;
