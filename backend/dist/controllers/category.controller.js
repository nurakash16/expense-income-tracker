"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategories = getCategories;
exports.createCategory = createCategory;
exports.deleteCategory = deleteCategory;
exports.updateCategory = updateCategory;
const db_1 = require("../config/db");
const Category_1 = require("../entities/Category");
const typeorm_1 = require("typeorm");
async function getCategories(req, res) {
    try {
        const categoryRepo = db_1.AppDataSource.getRepository(Category_1.Category);
        const list = await categoryRepo.find({
            where: { userId: req.user.id },
            order: { createdAt: 'DESC' },
        });
        res.json(list);
    }
    catch (error) {
        console.error('getCategories error:', error);
        res.status(500).json({ message: 'Error fetching categories', details: error?.message });
    }
}
async function createCategory(req, res) {
    try {
        let { name, type, budget } = req.body;
        name = String(name ?? '').trim();
        type = String(type ?? 'expense').toLowerCase();
        // IMPORTANT:
        // If your DB/entity enum DOES NOT include "both", remove it from this list.
        const allowed = ['income', 'expense', 'both'];
        if (!name)
            return res.status(400).json({ message: 'name required' });
        if (!allowed.includes(type))
            return res.status(400).json({ message: 'invalid type' });
        const budgetNum = Number(budget);
        const safeBudget = Number.isFinite(budgetNum) ? budgetNum : 0;
        const categoryRepo = db_1.AppDataSource.getRepository(Category_1.Category);
        // Prevent duplicates per user (very common error source)
        const existing = await categoryRepo.findOne({
            where: { userId: req.user.id, name },
        });
        if (existing) {
            return res.status(409).json({ message: 'Category already exists' });
        }
        const cat = categoryRepo.create({
            userId: req.user.id,
            name,
            type,
            budget: safeBudget,
        });
        await categoryRepo.save(cat);
        return res.json(cat);
    }
    catch (error) {
        console.error('createCategory error:', error);
        // Friendly handling for unique constraint errors
        if (error instanceof typeorm_1.QueryFailedError) {
            const msg = String(error?.message || '');
            const code = error?.code;
            // Postgres unique: 23505, MySQL: ER_DUP_ENTRY, SQLite: SQLITE_CONSTRAINT
            if (code === '23505' || code === 'ER_DUP_ENTRY' || msg.includes('SQLITE_CONSTRAINT')) {
                return res.status(409).json({ message: 'Category already exists' });
            }
        }
        return res.status(500).json({
            message: 'Error creating category',
            details: error?.message || 'Unknown error',
        });
    }
}
async function deleteCategory(req, res) {
    try {
        const categoryRepo = db_1.AppDataSource.getRepository(Category_1.Category);
        const result = await categoryRepo.delete({ id: req.params.id, userId: req.user.id });
        if (result.affected === 0) {
            return res.status(404).json({ message: 'Category not found or unauthorized' });
        }
        res.json({ message: 'Deleted' });
    }
    catch (error) {
        console.error('deleteCategory error:', error);
        res.status(500).json({ message: 'Error deleting category', details: error?.message });
    }
}
async function updateCategory(req, res) {
    try {
        const { name, type, budget } = req.body;
        const categoryRepo = db_1.AppDataSource.getRepository(Category_1.Category);
        const cat = await categoryRepo.findOne({ where: { id: req.params.id, userId: req.user.id } });
        if (!cat) {
            return res.status(404).json({ message: 'Category not found' });
        }
        if (name !== undefined)
            cat.name = String(name).trim();
        if (type !== undefined) {
            const normalized = String(type).toLowerCase();
            if (![Category_1.CategoryType.INCOME, Category_1.CategoryType.EXPENSE, Category_1.CategoryType.BOTH].includes(normalized)) {
                return res.status(400).json({ message: 'invalid type' });
            }
            cat.type = normalized;
        }
        if (budget !== undefined) {
            const b = Number(budget);
            cat.budget = Number.isFinite(b) ? b : 0;
        }
        await categoryRepo.save(cat);
        res.json(cat);
    }
    catch (error) {
        console.error('updateCategory error:', error);
        res.status(500).json({ message: 'Error updating category', details: error?.message });
    }
}
