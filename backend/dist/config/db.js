"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const User_1 = require("../entities/User");
const Category_1 = require("../entities/Category");
const Transaction_1 = require("../entities/Transaction");
const WeeklyRollup_1 = require("../entities/WeeklyRollup");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'income_tracker',
    synchronize: true,
    logging: false,
    entities: [User_1.User, Category_1.Category, Transaction_1.Transaction, WeeklyRollup_1.WeeklyRollup],
});
const connectDB = async () => {
    try {
        await exports.AppDataSource.initialize();
        console.log('✅ PostgreSQL connected');
    }
    catch (err) {
        console.error('❌ PostgreSQL connection error', err);
        throw err;
    }
};
exports.connectDB = connectDB;
