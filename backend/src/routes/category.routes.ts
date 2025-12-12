import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  getCategories,
  createCategory,
  deleteCategory,
} from '../controllers/category.controller';

const router = Router();

router.get('/', authMiddleware, getCategories);
router.post('/', authMiddleware, createCategory);
router.delete('/:id', authMiddleware, deleteCategory);

export default router;
