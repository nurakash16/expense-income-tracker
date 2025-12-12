import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  getTransactions,
  createTransaction,
  deleteTransaction,
  getDashboardStats,
  exportExcel,
  exportCsv,
  updateTransaction,
  importCsv,
} from '../controllers/transaction.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', authMiddleware, getTransactions);
router.post('/', authMiddleware, createTransaction);
router.put('/:id', authMiddleware, updateTransaction);
router.delete('/:id', authMiddleware, deleteTransaction);
// Dashboard stats endpoint (used by frontend dashboard)
router.get('/dashboard/stats', authMiddleware, getDashboardStats);
router.get('/export/excel', authMiddleware, exportExcel);
router.get('/export/csv', authMiddleware, exportCsv);
router.post('/import/csv', authMiddleware, upload.single('file'), importCsv);

export default router;
