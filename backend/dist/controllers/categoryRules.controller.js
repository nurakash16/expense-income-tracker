"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listRules = listRules;
exports.createRule = createRule;
exports.deleteRule = deleteRule;
const db_1 = require("../config/db");
const CategoryRule_1 = require("../entities/CategoryRule");
async function listRules(req, res) {
    const userId = req.user.id;
    const repo = db_1.AppDataSource.getRepository(CategoryRule_1.CategoryRule);
    const items = await repo.find({
        where: { userId },
        order: { priority: 'ASC', createdAt: 'ASC' },
    });
    res.json({ items });
}
async function createRule(req, res) {
    const userId = req.user.id;
    const { categoryId, pattern, isRegex, priority } = req.body;
    if (!categoryId || !pattern) {
        return res.status(400).json({ message: 'categoryId and pattern are required' });
    }
    const repo = db_1.AppDataSource.getRepository(CategoryRule_1.CategoryRule);
    const rule = repo.create({
        userId,
        categoryId,
        pattern: String(pattern).trim(),
        isRegex: Boolean(isRegex),
        priority: Number(priority) || 100,
    });
    await repo.save(rule);
    res.json({ item: rule });
}
async function deleteRule(req, res) {
    const userId = req.user.id;
    const { id } = req.params;
    const repo = db_1.AppDataSource.getRepository(CategoryRule_1.CategoryRule);
    const rule = await repo.findOneBy({ id, userId });
    if (!rule)
        return res.status(404).json({ message: 'Rule not found' });
    await repo.remove(rule);
    res.json({ message: 'OK' });
}
