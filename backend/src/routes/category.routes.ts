import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  getCategories,
  createCategory,
  deleteCategory,
  updateCategory
} from '../controllers/category.controller';

const router = Router();

router.get('/', authMiddleware, getCategories);
router.post('/', authMiddleware, createCategory);
router.put('/:id', authMiddleware, updateCategory);
router.delete('/:id', authMiddleware, deleteCategory);

export default router;
