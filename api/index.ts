import 'reflect-metadata';
import app from '../backend/src/app';
import { connectDB } from '../backend/src/config/db';

// Vercel Serverless Function Wrapper
export default async function handler(req: any, res: any) {
    try {
        await connectDB();
    } catch (e: any) {
        console.error('DB connection failed', e);
        return res.status(500).json({
            error: 'Database connection failed',
            details: e.message
        });
    }
    app(req, res);
}
