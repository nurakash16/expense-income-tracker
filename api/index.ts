import 'reflect-metadata';
import app from '../backend/src/app';
import { connectDB } from '../backend/src/config/db';

// Vercel Serverless Function Wrapper
export default async function handler(req: any, res: any) {
    try {
        await connectDB();
        app(req, res);
    } catch (e: any) {
        console.error('SERVER ERROR:', e);
        return res.status(500).json({
            error: 'CRITICAL SERVER ERROR',
            message: e.message,
            stack: e.stack,
            details: JSON.stringify(e)
        });
    }
}
