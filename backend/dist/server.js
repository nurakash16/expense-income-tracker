"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("./config/env");
const db_1 = require("./config/db");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const transaction_routes_1 = __importDefault(require("./routes/transaction.routes"));
const kpi_controller_1 = require("./controllers/kpi.controller");
const analytics_controller_1 = require("./controllers/analytics.controller");
const auth_middleware_1 = require("./middleware/auth.middleware");
const rollup_job_1 = require("./jobs/rollup.job");
const app = (0, express_1.default)();
// CORS: allow dev origins and Authorization header
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
app.get('/api/kpi', auth_middleware_1.authMiddleware, kpi_controller_1.getKpis);
app.get('/api/analytics/heatmap', auth_middleware_1.authMiddleware, analytics_controller_1.getHeatmap);
app.get('/api/analytics/waterfall', auth_middleware_1.authMiddleware, analytics_controller_1.getWaterfall);
app.get('/api/analytics/rollups', auth_middleware_1.authMiddleware, analytics_controller_1.getRollups);
// Serve Static Frontend
const frontendPath = path_1.default.join(__dirname, '../../dist/income-expense-tracker/browser');
app.use(express_1.default.static(frontendPath));
app.get('*', (req, res) => {
    res.sendFile(path_1.default.join(frontendPath, 'index.html'));
});
const PORT = process.env.PORT || 3000;
(0, db_1.connectDB)()
    .then(() => {
    (0, rollup_job_1.scheduleWeeklyRollupJob)();
    app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));
})
    .catch((err) => {
    console.error('Failed to connect to database', err);
    process.exit(1);
});
