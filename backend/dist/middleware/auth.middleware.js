"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const User_1 = require("../entities/User");
async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7)
        : null;
    if (!token)
        return res.status(401).json({ message: 'Unauthorized' });
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env['JWT_SECRET']);
        // Check if ID is valid UUID format before querying
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(payload.id)) {
            return res.status(401).json({ message: 'Invalid token structure' });
        }
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOneBy({ id: payload.id });
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        req.user = payload;
        next();
    }
    catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}
