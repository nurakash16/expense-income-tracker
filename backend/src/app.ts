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

import notificationsRoutes from './routes/notifications.routes';
import categoryRulesRoutes from './routes/categoryRules.routes';

const app = express();

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
app.use('/api/notifications', notificationsRoutes);
app.use('/api/category-rules', categoryRulesRoutes);

app.get('/api/kpi', authMiddleware as any, getKpis);
app.get('/api/analytics/heatmap', authMiddleware as any, getHeatmap);
app.get('/api/analytics/waterfall', authMiddleware as any, getWaterfall);
app.get('/api/analytics/rollups', authMiddleware as any, getRollups);

app.use((err: any, req: any, res: any, next: any) => {
    console.error('Global API Error:', err);
    res.status(500).json({
        message: err.message || 'Internal Server Error',
        details: process.env['NODE_ENV'] === 'development' ? err : undefined
    });
});

export default app;
