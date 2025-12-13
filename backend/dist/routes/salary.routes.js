"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const salary_controller_1 = require("../controllers/salary.controller");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authMiddleware, salary_controller_1.getSalary);
router.post('/', auth_middleware_1.authMiddleware, salary_controller_1.upsertSalary);
exports.default = router;
