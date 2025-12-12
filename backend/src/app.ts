import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import './config/env';

import authRoutes from './routes/auth.routes';
import categoryRoutes from './routes/category.routes';
import transactionRoutes from './routes/transaction.routes';
import { getKpis } from './controllers/kpi.controller';
import { getHeatmap, getWaterfall, getRollups } from './controllers/analytics.controller';
import { authMiddleware } from './middleware/auth.middleware';

const app = express();

// CORS: allow dev origins and Authorization header
app.use(cors({
    origin: (origin, cb) => cb(null, true),
    credentials: false,
    allowedHeaders: ['Authorization', 'Content-Type'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.get('/api/kpi', authMiddleware as any, getKpis);
app.get('/api/analytics/heatmap', authMiddleware as any, getHeatmap);
app.get('/api/analytics/waterfall', authMiddleware as any, getWaterfall);
app.get('/api/analytics/rollups', authMiddleware as any, getRollups);

export default app;
