import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
    listNotifications,
    unreadCount,
    markRead,
    markAllRead,
} from '../controllers/notifications.controller';

const router = Router();

router.get('/', authMiddleware as any, listNotifications);
router.get('/unread-count', authMiddleware as any, unreadCount);
router.post('/:id/read', authMiddleware as any, markRead);
router.post('/read-all', authMiddleware as any, markAllRead);

export default router;
