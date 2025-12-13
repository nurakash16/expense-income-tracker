import jwt from 'jsonwebtoken';

import { AppDataSource } from '../config/db';
import { User } from '../entities/User';

export async function authMiddleware(req: any, res: any, next: any) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7)
        : null;

    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const payload = jwt.verify(token, process.env['JWT_SECRET'] as string) as any;

        // Check if ID is valid UUID format before querying
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(payload.id)) {
            return res.status(401).json({ message: 'Invalid token structure' });
        }

        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOneBy({ id: payload.id });

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}
