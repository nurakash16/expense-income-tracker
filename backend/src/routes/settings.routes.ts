import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { getSettings, updateSettings } from '../controllers/settings.controller';

const router = Router();

router.get('/', authMiddleware, getSettings);
router.patch('/', authMiddleware, updateSettings);

export default router;
