import app from '../backend/src/app';
import { connectDB } from '../backend/src/config/db';

// Vercel Serverless Function Wrapper
export default async function handler(req: any, res: any) {
    try {
        await connectDB();
    } catch (e) {
        console.error('DB connection failed', e);
    }
    app(req, res);
}
