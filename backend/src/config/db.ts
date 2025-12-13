import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Category } from '../entities/Category';
import { Transaction } from '../entities/Transaction';
import { WeeklyRollup } from '../entities/WeeklyRollup';
import { Notification } from '../entities/Notification';
import { CategoryRule } from '../entities/CategoryRule';
import { MonthlyRollup } from '../entities/MonthlyRollup';

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
    migrations: ['dist/migrations/*.js'],

    ssl: (!process.env['DB_HOST'] || process.env['DB_HOST'] === 'localhost' || process.env['DB_HOST'] === '127.0.0.1')
        ? false
        : { rejectUnauthorized: false }
});


let dbInitializationPromise: Promise<DataSource> | null = null;

export async function connectDB() {
    if (AppDataSource.isInitialized) {
        return;
    }

    if (!dbInitializationPromise) {
        dbInitializationPromise = AppDataSource.initialize();
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

