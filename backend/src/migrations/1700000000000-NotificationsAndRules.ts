import { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificationsAndRules1700000000000 implements MigrationInterface {
    name = 'NotificationsAndRules1700000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      create table if not exists public.notifications (
        id uuid primary key default gen_random_uuid(),
        "userId" uuid not null,
        type varchar(64) not null,
        title varchar(200) not null,
        message text not null,
        meta jsonb null,
        "readAt" timestamptz null,
        "createdAt" timestamptz not null default now()
      );
    `);

        await queryRunner.query(`
      create index if not exists idx_notifications_user
      on public.notifications ("userId");
    `);

        await queryRunner.query(`
      create index if not exists idx_notifications_user_created
      on public.notifications ("userId", "createdAt" desc);
    `);

        await queryRunner.query(`
      create table if not exists public.category_rules (
        id uuid primary key default gen_random_uuid(),
        "userId" uuid not null,
        "categoryId" uuid not null,
        pattern varchar(200) not null,
        "isRegex" boolean not null default false,
        priority int not null default 100,
        "createdAt" timestamptz not null default now()
      );
    `);

        await queryRunner.query(`
      create index if not exists idx_rules_user
      on public.category_rules ("userId");
    `);

        await queryRunner.query(`
      create index if not exists idx_rules_user_priority
      on public.category_rules ("userId", priority asc);
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`drop table if exists public.category_rules;`);
        await queryRunner.query(`drop table if exists public.notifications;`);
    }
}
