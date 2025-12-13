"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const db_1 = require("./config/db");
const rollup_job_1 = require("./jobs/rollup.job");
const app_1 = __importDefault(require("./app"));
// Serve Static Frontend (Only in server.ts, not in app.ts which is used by Vercel)
const frontendPath = path_1.default.join(__dirname, '../../dist/income-expense-tracker/browser');
app_1.default.use(express_1.default.static(frontendPath));
app_1.default.get(/(.*)/, (req, res) => {
    res.sendFile(path_1.default.join(frontendPath, 'index.html'));
});
const PORT = process.env.PORT || 3000;
(0, db_1.connectDB)()
    .then(() => {
    (0, rollup_job_1.scheduleWeeklyRollupJob)();
    app_1.default.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));
})
    .catch((err) => {
    console.error('Failed to connect to database', err);
    process.exit(1);
});
