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
const MonthlySalary_1 = require("../entities/MonthlySalary");
const UserSettings_1 = require("../entities/UserSettings");
const _1700000000000_NotificationsAndRules_1 = require("../migrations/1700000000000-NotificationsAndRules");
const _1700000000001_MonthlyRollups_1 = require("../migrations/1700000000001-MonthlyRollups");
const _1700000000002_AddBudgetToCategory_1 = require("../migrations/1700000000002-AddBudgetToCategory");
const _1700000000003_AddSalaryAndSettings_1 = require("../migrations/1700000000003-AddSalaryAndSettings");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env['DB_HOST'],
    port: Number(process.env['DB_PORT']),
    username: process.env['DB_USERNAME'],
    password: process.env['DB_PASSWORD'],
    database: process.env['DB_NAME'],
    synchronize: false,
    logging: false,
    entities: [User_1.User, Category_1.Category, Transaction_1.Transaction, WeeklyRollup_1.WeeklyRollup, Notification_1.Notification, CategoryRule_1.CategoryRule, MonthlyRollup_1.MonthlyRollup, MonthlySalary_1.MonthlySalary, UserSettings_1.UserSettings],
    migrations: [
        _1700000000000_NotificationsAndRules_1.NotificationsAndRules1700000000000,
        _1700000000001_MonthlyRollups_1.MonthlyRollups1700000000001,
        _1700000000002_AddBudgetToCategory_1.AddBudgetToCategory1700000000002,
        _1700000000003_AddSalaryAndSettings_1.AddSalaryAndSettings1700000000003
    ],
    ssl: (!process.env['DB_HOST'] || process.env['DB_HOST'] === 'localhost' || process.env['DB_HOST'] === '127.0.0.1')
        ? false
        : { rejectUnauthorized: false },
    extra: {
        max: 1 // Limit pool size to 1 usage per Lambda to avoid 'MaxClientsInSessionMode' errors
    }
});
let dbInitializationPromise = null;
async function connectDB() {
    if (exports.AppDataSource.isInitialized) {
        return;
    }
    if (!dbInitializationPromise) {
        dbInitializationPromise = exports.AppDataSource.initialize().then(async (source) => {
            console.log('Running pending migrations...');
            const migrations = await source.runMigrations();
            console.log(`Migrations executed: ${migrations.length}`);
            return source;
        });
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
