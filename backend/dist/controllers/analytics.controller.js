"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHeatmap = getHeatmap;
exports.getWaterfall = getWaterfall;
exports.getRollups = getRollups;
const db_1 = require("../config/db");
const Transaction_1 = require("../entities/Transaction");
const WeeklyRollup_1 = require("../entities/WeeklyRollup");
async function getHeatmap(req, res) {
    try {
        const repo = db_1.AppDataSource.getRepository(Transaction_1.Transaction);
        const userId = req.user.id;
        const year = String(req.query.year || new Date().getFullYear());
        const start = `${year}-01-01`;
        const end = `${year}-12-31`;
        const rows = await repo
            .createQueryBuilder('t')
            .select('t.date', 'date')
            .addSelect("SUM(CASE WHEN t.type='expense' THEN t.amount ELSE 0 END)", 'value')
            .where('t.userId = :userId', { userId })
            .andWhere('t.date BETWEEN :start AND :end', { start, end })
            .groupBy('t.date')
            .orderBy('t.date', 'ASC')
            .getRawMany();
        const data = rows.map((r) => [r.date, Number(r.value)]);
        res.json({ year, data });
    }
    catch (e) {
        console.error('heatmap error', e);
        res.status(500).json({ message: 'Error building heatmap' });
    }
}
async function getWaterfall(req, res) {
    try {
        const repo = db_1.AppDataSource.getRepository(Transaction_1.Transaction);
        const userId = req.user.id;
        const { start, end } = req.query; // YYYY-MM
        const months = [];
        const toMonth = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const endDate = end ? new Date(`${end}-01`) : new Date();
        const startDate = start ? new Date(`${start}-01`) : new Date(endDate.getFullYear(), endDate.getMonth() - 5, 1);
        let d = new Date(startDate);
        while (d <= endDate) {
            months.push(toMonth(d));
            d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        }
        const rows = await repo
            .createQueryBuilder('t')
            .select("SUBSTRING(t.date FROM 1 FOR 7)", 'month')
            .addSelect("SUM(CASE WHEN t.type='income' THEN t.amount ELSE 0 END)", 'income')
            .addSelect("SUM(CASE WHEN t.type='expense' THEN t.amount ELSE 0 END)", 'expense')
            .where('t.userId = :userId', { userId })
            .andWhere('t.date BETWEEN :start AND :end', { start: `${months[0]}-01`, end: `${months[months.length - 1]}-31` })
            .groupBy('month')
            .orderBy('month', 'ASC')
            .getRawMany();
        const byMonth = new Map();
        rows.forEach((r) => byMonth.set(r.month, { income: Number(r.income), expense: Number(r.expense) }));
        const income = months.map((m) => byMonth.get(m)?.income ?? 0);
        const expense = months.map((m) => byMonth.get(m)?.expense ?? 0);
        const net = months.map((_, i) => income[i] - expense[i]);
        res.json({ months, income, expense, net });
    }
    catch (e) {
        console.error('waterfall error', e);
        res.status(500).json({ message: 'Error building waterfall' });
    }
}
async function getRollups(req, res) {
    try {
        const repo = db_1.AppDataSource.getRepository(WeeklyRollup_1.WeeklyRollup);
        const userId = req.user.id;
        const { start, end } = req.query; // YYYY-MM-DD
        const qb = repo.createQueryBuilder('w').where('w.userId = :userId', { userId });
        if (start)
            qb.andWhere('w.weekStart >= :start', { start });
        if (end)
            qb.andWhere('w.weekStart <= :end', { end });
        const rows = await qb.orderBy('w.weekStart', 'ASC').getMany();
        const weeks = rows.map(r => r.weekStart);
        const income = rows.map(r => r.incomeTotal);
        const expense = rows.map(r => r.expenseTotal);
        const balance = rows.map(r => r.balance);
        res.json({ weeks, income, expense, balance });
    }
    catch (e) {
        console.error('rollups error', e);
        res.status(500).json({ message: 'Error fetching rollups' });
    }
}
