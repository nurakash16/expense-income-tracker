"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
exports.connectDB = connectDB;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const User_1 = require("../entities/User");
const Category_1 = require("../entities/Category");
const Transaction_1 = require("../entities/Transaction");
const WeeklyRollup_1 = require("../entities/WeeklyRollup");
const Notification_1 = require("../entities/Notification");
const CategoryRule_1 = require("../entities/CategoryRule");
const MonthlyRollup_1 = require("../entities/MonthlyRollup");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env['DB_HOST'],
    port: Number(process.env['DB_PORT']),
    username: process.env['DB_USERNAME'],
    password: process.env['DB_PASSWORD'],
    database: process.env['DB_NAME'],
    synchronize: false,
    logging: false,
    entities: [User_1.User, Category_1.Category, Transaction_1.Transaction, WeeklyRollup_1.WeeklyRollup, Notification_1.Notification, CategoryRule_1.CategoryRule, MonthlyRollup_1.MonthlyRollup],
    migrations: ['dist/migrations/*.js'],
    ssl: (!process.env['DB_HOST'] || process.env['DB_HOST'] === 'localhost' || process.env['DB_HOST'] === '127.0.0.1')
        ? false
        : { rejectUnauthorized: false }
});
let dbInitializationPromise = null;
async function connectDB() {
    if (exports.AppDataSource.isInitialized) {
        return;
    }
    if (!dbInitializationPromise) {
        dbInitializationPromise = exports.AppDataSource.initialize();
    }
    try {
        await dbInitializationPromise;
        console.log('✅ PostgreSQL connected');
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        dbInitializationPromise = null; // Reset on failure to allow retry
        throw error;
    }
}
