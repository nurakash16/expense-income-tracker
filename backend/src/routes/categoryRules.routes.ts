import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { listRules, createRule, deleteRule } from '../controllers/categoryRules.controller';

const router = Router();

router.get('/', authMiddleware as any, listRules);
router.post('/', authMiddleware as any, createRule);
router.delete('/:id', authMiddleware as any, deleteRule);

export default router;
