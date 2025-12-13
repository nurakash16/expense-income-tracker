import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { getSalary, upsertSalary } from '../controllers/salary.controller';

const router = Router();

router.get('/', authMiddleware, getSalary);
router.post('/', authMiddleware, upsertSalary);

export default router;
