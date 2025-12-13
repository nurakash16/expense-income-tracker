import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Category } from '../entities/Category';
import { Transaction } from '../entities/Transaction';
import { WeeklyRollup } from '../entities/WeeklyRollup';
import { Notification } from '../entities/Notification';
import { CategoryRule } from '../entities/CategoryRule';
import { MonthlyRollup } from '../entities/MonthlyRollup';
import { NotificationsAndRules1700000000000 } from '../migrations/1700000000000-NotificationsAndRules';
import { MonthlyRollups1700000000001 } from '../migrations/1700000000001-MonthlyRollups';
import { AddBudgetToCategory1700000000002 } from '../migrations/1700000000002-AddBudgetToCategory';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env['DB_HOST'],
    port: Number(process.env['DB_PORT']),
    username: process.env['DB_USERNAME'],
    password: process.env['DB_PASSWORD'],
    database: process.env['DB_NAME'],
    synchronize: false,
    logging: false,
    entities: [User, Category, Transaction, WeeklyRollup, Notification, CategoryRule, MonthlyRollup],
    migrations: [
        NotificationsAndRules1700000000000,
        MonthlyRollups1700000000001,
        AddBudgetToCategory1700000000002
    ],

    ssl: (!process.env['DB_HOST'] || process.env['DB_HOST'] === 'localhost' || process.env['DB_HOST'] === '127.0.0.1')
        ? false
        : { rejectUnauthorized: false },
    extra: {
        max: 1 // Limit pool size to 1 usage per Lambda to avoid 'MaxClientsInSessionMode' errors
    }
});


let dbInitializationPromise: Promise<DataSource> | null = null;

export async function connectDB() {
    if (AppDataSource.isInitialized) {
        return;
    }

    if (!dbInitializationPromise) {
        dbInitializationPromise = AppDataSource.initialize().then(async (source) => {
            console.log('Running pending migrations...');
            const migrations = await source.runMigrations();
            console.log(`Migrations executed: ${migrations.length}`);
            return source;
        });
    }

    try {
        await dbInitializationPromise;
        console.log('✅ PostgreSQL connected');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        dbInitializationPromise = null; // Reset on failure to allow retry
        throw error;
    }
}

