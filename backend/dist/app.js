"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("./config/env");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const transaction_routes_1 = __importDefault(require("./routes/transaction.routes"));
const kpi_controller_1 = require("./controllers/kpi.controller");
const analytics_controller_1 = require("./controllers/analytics.controller");
const auth_middleware_1 = require("./middleware/auth.middleware");
const notifications_routes_1 = __importDefault(require("./routes/notifications.routes"));
const categoryRules_routes_1 = __importDefault(require("./routes/categoryRules.routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: (origin, cb) => cb(null, true),
    credentials: false,
    allowedHeaders: ['Authorization', 'Content-Type'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express_1.default.json());
app.use('/api/auth', auth_routes_1.default);
app.use('/api/categories', category_routes_1.default);
app.use('/api/transactions', transaction_routes_1.default);
app.use('/api/notifications', notifications_routes_1.default);
app.use('/api/category-rules', categoryRules_routes_1.default);
app.get('/api/kpi', auth_middleware_1.authMiddleware, kpi_controller_1.getKpis);
app.get('/api/analytics/heatmap', auth_middleware_1.authMiddleware, analytics_controller_1.getHeatmap);
app.get('/api/analytics/waterfall', auth_middleware_1.authMiddleware, analytics_controller_1.getWaterfall);
app.get('/api/analytics/rollups', auth_middleware_1.authMiddleware, analytics_controller_1.getRollups);
app.use((err, req, res, next) => {
    console.error('Global API Error:', err);
    res.status(500).json({
        message: err.message || 'Internal Server Error',
        details: process.env['NODE_ENV'] === 'development' ? err : undefined
    });
});
exports.default = app;
