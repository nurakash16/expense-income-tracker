"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const settings_controller_1 = require("../controllers/settings.controller");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authMiddleware, settings_controller_1.getSettings);
router.patch('/', auth_middleware_1.authMiddleware, settings_controller_1.updateSettings);
exports.default = router;
