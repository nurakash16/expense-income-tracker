import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { getSettings, updateSettings, getAccount, updateAccount, changePassword } from '../controllers/settings.controller';

const router = Router();

router.get('/', authMiddleware, getSettings);
router.patch('/', authMiddleware, updateSettings);
router.get('/account', authMiddleware, getAccount);
router.patch('/account', authMiddleware, updateAccount);
router.post('/change-password', authMiddleware, changePassword);

export default router;
