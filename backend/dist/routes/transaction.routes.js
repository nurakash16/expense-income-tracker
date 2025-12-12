"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const transaction_controller_1 = require("../controllers/transaction.controller");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.get('/', auth_middleware_1.authMiddleware, transaction_controller_1.getTransactions);
router.post('/', auth_middleware_1.authMiddleware, transaction_controller_1.createTransaction);
router.put('/:id', auth_middleware_1.authMiddleware, transaction_controller_1.updateTransaction);
router.delete('/:id', auth_middleware_1.authMiddleware, transaction_controller_1.deleteTransaction);
// Dashboard stats endpoint (used by frontend dashboard)
router.get('/dashboard/stats', auth_middleware_1.authMiddleware, transaction_controller_1.getDashboardStats);
router.get('/export/excel', auth_middleware_1.authMiddleware, transaction_controller_1.exportExcel);
router.get('/export/csv', auth_middleware_1.authMiddleware, transaction_controller_1.exportCsv);
router.post('/import/csv', auth_middleware_1.authMiddleware, upload.single('file'), transaction_controller_1.importCsv);
exports.default = router;
