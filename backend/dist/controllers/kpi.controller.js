"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKpis = getKpis;
const db_1 = require("../config/db");
const Transaction_1 = require("../entities/Transaction");
async function getKpis(req, res) {
    try {
        const repo = db_1.AppDataSource.getRepository(Transaction_1.Transaction);
        const userId = req.user.id;
        const { start, end, type, categoryId, paymentMethod } = req.query;
        const totals = await repo.createQueryBuilder('t')
            .select("SUM(CASE WHEN t.type='income' THEN t.amount ELSE 0 END)", 'income')
            .addSelect("SUM(CASE WHEN t.type='expense' THEN t.amount ELSE 0 END)", 'expense')
            .where('t.userId = :userId', { userId })
            .andWhere(start ? 't.date >= :start' : '1=1', { start })
            .andWhere(end ? 't.date <= :end' : '1=1', { end })
            .andWhere(type && (type === 'income' || type === 'expense') ? 't.type = :type' : '1=1', { type })
            .andWhere(categoryId ? 't.categoryId = :categoryId' : '1=1', { categoryId })
            .andWhere(paymentMethod ? 't.paymentMethod = :paymentMethod' : '1=1', { paymentMethod })
            .getRawOne();
        const avg = await repo.createQueryBuilder('t')
            .select('AVG(t.amount)', 'avg')
            .where('t.userId = :userId', { userId })
            .andWhere(start ? 't.date >= :start' : '1=1', { start })
            .andWhere(end ? 't.date <= :end' : '1=1', { end })
            .andWhere(type && (type === 'income' || type === 'expense') ? 't.type = :type' : '1=1', { type })
            .andWhere(categoryId ? 't.categoryId = :categoryId' : '1=1', { categoryId })
            .andWhere(paymentMethod ? 't.paymentMethod = :paymentMethod' : '1=1', { paymentMethod })
            .getRawOne();
        const largestIncome = await repo.findOne({ where: { userId, type: Transaction_1.TransactionType.INCOME }, order: { amount: 'DESC' } });
        const largestExpense = await repo.findOne({ where: { userId, type: Transaction_1.TransactionType.EXPENSE }, order: { amount: 'DESC' } });
        const catShare = await repo.createQueryBuilder('t')
            .leftJoin('t.category', 'c')
            .select('c.name', 'name')
            .addSelect("SUM(CASE WHEN t.type='expense' THEN t.amount ELSE 0 END)", 'value')
            .where('t.userId = :userId', { userId })
            .andWhere(start ? 't.date >= :start' : '1=1', { start })
            .andWhere(end ? 't.date <= :end' : '1=1', { end })
            .andWhere(categoryId ? 't.categoryId = :categoryId' : '1=1', { categoryId })
            .andWhere(paymentMethod ? 't.paymentMethod = :paymentMethod' : '1=1', { paymentMethod })
            .groupBy('c.name')
            .orderBy('value', 'DESC')
            .limit(10)
            .getRawMany();
        res.json({
            totals: { income: Number(totals?.income || 0), expense: Number(totals?.expense || 0) },
            balance: Number(totals?.income || 0) - Number(totals?.expense || 0),
            average: Number(avg?.avg || 0),
            largestIncome,
            largestExpense,
            topExpenseCategories: catShare.map(x => ({ name: x.name || 'Uncategorized', value: Number(x.value) }))
        });
    }
    catch (e) {
        console.error('kpi error', e);
        res.status(500).json({ message: 'Error computing KPIs' });
    }
}
