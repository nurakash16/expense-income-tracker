"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
require("./config/env");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const transaction_routes_1 = __importDefault(require("./routes/transaction.routes"));
const kpi_controller_1 = require("./controllers/kpi.controller");
const analytics_controller_1 = require("./controllers/analytics.controller");
const auth_middleware_1 = require("./middleware/auth.middleware");
const notifications_routes_1 = __importDefault(require("./routes/notifications.routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: (origin, cb) => cb(null, true),
    credentials: false,
    allowedHeaders: ['Authorization', 'Content-Type'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express_1.default.json());
app.use((0, compression_1.default)());
const salary_routes_1 = __importDefault(require("./routes/salary.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
app.use('/api/auth', auth_routes_1.default);
app.use('/api/categories', category_routes_1.default);
app.use('/api/transactions', transaction_routes_1.default);
app.use('/api/notifications', notifications_routes_1.default);
app.use('/api/salary', salary_routes_1.default);
app.use('/api/settings', settings_routes_1.default);
app.get('/api/kpi', auth_middleware_1.authMiddleware, kpi_controller_1.getKpis);
app.get('/api/analytics/heatmap', auth_middleware_1.authMiddleware, analytics_controller_1.getHeatmap);
app.get('/api/analytics/waterfall', auth_middleware_1.authMiddleware, analytics_controller_1.getWaterfall);
app.get('/api/analytics/rollups', auth_middleware_1.authMiddleware, analytics_controller_1.getRollups);
app.get('/api/analytics/monthly', auth_middleware_1.authMiddleware, analytics_controller_1.getMonthlyInsights);
app.get('/api/analytics/overview', auth_middleware_1.authMiddleware, analytics_controller_1.getAnalyticsOverview);
// Manual migration trigger for serverless environments
const db_1 = require("./config/db");
app.get('/api/migrate-now', async (req, res) => {
    try {
        if (!db_1.AppDataSource.isInitialized) {
            await db_1.AppDataSource.initialize();
        }
        const migrations = await db_1.AppDataSource.runMigrations();
        res.json({
            message: 'Migrations executed successfully',
            count: migrations.length,
            migrations: migrations.map(m => m.name)
        });
    }
    catch (e) {
        console.error('Migration failed:', e);
        res.status(500).json({ error: e.message, stack: e.stack });
    }
});
app.get('/api/health', async (req, res) => {
    try {
        const { AppDataSource } = require('./config/db');
        if (!AppDataSource.isInitialized) {
            return res.status(503).json({ status: 'error', message: 'DB not initialized' });
        }
        res.json({ status: 'ok', db: 'connected' });
    }
    catch (e) {
        res.status(500).json({ status: 'error', error: e.message });
    }
});
app.use((err, req, res, next) => {
    console.error('Global API Error:', err);
    res.status(500).json({
        message: err.message || 'Internal Server Error',
        stack: err.stack, // Exposed for debugging
        details: err
    });
});
exports.default = app;
