"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHeatmap = getHeatmap;
exports.getWaterfall = getWaterfall;
exports.getRollups = getRollups;
exports.getMonthlyInsights = getMonthlyInsights;
exports.getAnalyticsOverview = getAnalyticsOverview;
const db_1 = require("../config/db");
const Transaction_1 = require("../entities/Transaction");
const WeeklyRollup_1 = require("../entities/WeeklyRollup");
const Category_1 = require("../entities/Category");
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
// New Insights Endpoints reading from MonthlyRollup
const MonthlyRollup_1 = require("../entities/MonthlyRollup");
function monthRange(monthsBack, endMonth) {
    const end = endMonth ? new Date(`${endMonth}-01`) : new Date();
    const start = new Date(end.getFullYear(), end.getMonth() - (monthsBack - 1), 1);
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const months = [];
    let cursor = new Date(start);
    while (cursor <= end) {
        months.push(fmt(cursor));
        cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
    return { start: `${fmt(start)}-01`, end: `${fmt(end)}-31`, months };
}
async function getMonthlyInsights(req, res) {
    try {
        const repo = db_1.AppDataSource.getRepository(MonthlyRollup_1.MonthlyRollup);
        const userId = req.user.id;
        const { month } = req.query; // YYYY-MM-01 format expected
        if (!month) {
            return res.status(400).json({ message: 'Month parameter (YYYY-MM-01) is required' });
        }
        const currentMonth = month;
        // Calculate previous month
        const d = new Date(currentMonth);
        d.setMonth(d.getMonth() - 1);
        const prevMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
        const currentData = await repo.find({ where: { userId, month: currentMonth } });
        const prevData = await repo.find({ where: { userId, month: prevMonth } });
        // Summarize totals
        const currentTotal = currentData.reduce((acc, r) => ({
            income: acc.income + Number(r.totalIncome),
            expense: acc.expense + Number(r.totalExpense)
        }), { income: 0, expense: 0 });
        const prevTotal = prevData.reduce((acc, r) => ({
            income: acc.income + Number(r.totalIncome),
            expense: acc.expense + Number(r.totalExpense)
        }), { income: 0, expense: 0 });
        // Compare categories
        const categoriesDiff = currentData.map(c => {
            const prev = prevData.find(p => p.categoryId === c.categoryId);
            const prevExpense = prev ? Number(prev.totalExpense) : 0;
            const currExpense = Number(c.totalExpense);
            const diff = currExpense - prevExpense;
            const pct = prevExpense > 0 ? (diff / prevExpense) * 100 : (currExpense > 0 ? 100 : 0);
            return {
                categoryId: c.categoryId,
                current: currExpense,
                previous: prevExpense,
                diff,
                pct,
                isUnusual: currExpense > (prevExpense * 1.3) && currExpense > 50 // Simple threshold: 30% more and absolute > 50
            };
        });
        // Sort by biggest absolute increase
        categoriesDiff.sort((a, b) => b.diff - a.diff);
        res.json({
            current: currentTotal,
            previous: prevTotal,
            delta: {
                income: currentTotal.income - prevTotal.income,
                expense: currentTotal.expense - prevTotal.expense
            },
            categoryDetails: categoriesDiff
        });
    }
    catch (e) {
        console.error('insights error', e);
        res.status(500).json({ message: 'Error fetching insights' });
    }
}
// Rich overview for dashboard (trends, breakdowns, alerts)
async function getAnalyticsOverview(req, res) {
    try {
        const repo = db_1.AppDataSource.getRepository(Transaction_1.Transaction);
        const userId = req.user.id;
        const months = Number(req.query.months || 6);
        const endMonth = req.query.end; // YYYY-MM
        const { start, end, months: monthBuckets } = monthRange(months, endMonth);
        // Totals and savings rate
        const totalsRow = await repo.createQueryBuilder('t')
            .select("SUM(CASE WHEN t.type='income' THEN t.amount ELSE 0 END)", 'income')
            .addSelect("SUM(CASE WHEN t.type='expense' THEN t.amount ELSE 0 END)", 'expense')
            .where('t.userId = :userId', { userId })
            .andWhere('t.date BETWEEN :start AND :end', { start, end })
            .getRawOne();
        const incomeTotal = Number(totalsRow?.income || 0);
        const expenseTotal = Number(totalsRow?.expense || 0);
        const net = incomeTotal - expenseTotal;
        const savingsRate = incomeTotal > 0 ? ((incomeTotal - expenseTotal) / incomeTotal) * 100 : 0;
        // Monthly trend
        const trendRows = await repo.createQueryBuilder('t')
            .select("SUBSTRING(t.date FROM 1 FOR 7)", 'month')
            .addSelect("SUM(CASE WHEN t.type='income' THEN t.amount ELSE 0 END)", 'income')
            .addSelect("SUM(CASE WHEN t.type='expense' THEN t.amount ELSE 0 END)", 'expense')
            .where('t.userId = :userId', { userId })
            .andWhere('t.date BETWEEN :start AND :end', { start, end })
            .groupBy('month')
            .orderBy('month', 'ASC')
            .getRawMany();
        const trendMap = new Map();
        trendRows.forEach((r) => trendMap.set(r.month, { income: Number(r.income), expense: Number(r.expense) }));
        const trend = {
            months: monthBuckets,
            income: monthBuckets.map(m => trendMap.get(m)?.income || 0),
            expense: monthBuckets.map(m => trendMap.get(m)?.expense || 0),
            net: monthBuckets.map(m => (trendMap.get(m)?.income || 0) - (trendMap.get(m)?.expense || 0))
        };
        // Expense breakdown (last 90 days)
        const expenseBreakdown = await repo.createQueryBuilder('t')
            .leftJoin(Category_1.Category, 'c', 'c.id = t.categoryId')
            .select('COALESCE(c.name, \'Uncategorized\')', 'name')
            .addSelect('t.categoryId', 'categoryId')
            .addSelect("SUM(CASE WHEN t.type='expense' THEN t.amount ELSE 0 END)", 'value')
            .where('t.userId = :userId', { userId })
            .andWhere("t.type = 'expense'")
            .andWhere('t.date >= :start', { start: monthRange(3).start }) // last 3 months
            .groupBy('t.categoryId')
            .addGroupBy('c.name')
            .orderBy('value', 'DESC')
            .limit(8)
            .getRawMany();
        // Income breakdown (last 90 days)
        const incomeBreakdown = await repo.createQueryBuilder('t')
            .leftJoin(Category_1.Category, 'c', 'c.id = t.categoryId')
            .select('COALESCE(c.name, \'Uncategorized\')', 'name')
            .addSelect('t.categoryId', 'categoryId')
            .addSelect("SUM(CASE WHEN t.type='income' THEN t.amount ELSE 0 END)", 'value')
            .where('t.userId = :userId', { userId })
            .andWhere("t.type = 'income'")
            .andWhere('t.date >= :start', { start: monthRange(3).start })
            .groupBy('t.categoryId')
            .addGroupBy('c.name')
            .orderBy('value', 'DESC')
            .limit(8)
            .getRawMany();
        // Payment method share (last 90 days, expenses only)
        const paymentMethods = await repo.createQueryBuilder('t')
            .select('COALESCE(t.paymentMethod, \'other\')', 'name')
            .addSelect("SUM(CASE WHEN t.type='expense' THEN t.amount ELSE 0 END)", 'value')
            .where('t.userId = :userId', { userId })
            .andWhere("t.type = 'expense'")
            .andWhere('t.date >= :start', { start: monthRange(3).start })
            .groupBy('t.paymentMethod')
            .orderBy('value', 'DESC')
            .getRawMany();
        // Top transactions (last 30 days)
        const topTransactions = await repo.createQueryBuilder('t')
            .leftJoin(Category_1.Category, 'c', 'c.id = t.categoryId')
            .select(['t.id', 't.amount', 't.type', 't.date', 't.note', 'c.name'])
            .where('t.userId = :userId', { userId })
            .andWhere('t.date >= :start', { start: monthRange(1).start })
            .orderBy('t.amount', 'DESC')
            .limit(5)
            .getRawMany();
        // Alerts: category spikes (last month vs previous 3 months)
        const endDate = endMonth ? new Date(`${endMonth}-01`) : new Date();
        const lastMonthDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);
        const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
        const lastMonthStart = `${lastMonth}-01`;
        const lastMonthEnd = `${lastMonth}-31`;
        const trailingStartDate = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() - 3, 1);
        const trailingStart = `${trailingStartDate.getFullYear()}-${String(trailingStartDate.getMonth() + 1).padStart(2, '0')}-01`;
        const trailingEnd = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}-31`;
        const lastMonthTotals = await repo.createQueryBuilder('t')
            .select('t.categoryId', 'categoryId')
            .addSelect("SUM(CASE WHEN t.type='expense' THEN t.amount ELSE 0 END)", 'value')
            .where('t.userId = :userId', { userId })
            .andWhere("t.type = 'expense'")
            .andWhere('t.date BETWEEN :start AND :end', { start: lastMonthStart, end: lastMonthEnd })
            .groupBy('t.categoryId')
            .getRawMany();
        const trailingTotals = await repo.createQueryBuilder('t')
            .select('t.categoryId', 'categoryId')
            .addSelect("SUM(CASE WHEN t.type='expense' THEN t.amount ELSE 0 END)", 'value')
            .where('t.userId = :userId', { userId })
            .andWhere("t.type = 'expense'")
            .andWhere('t.date BETWEEN :start AND :end', { start: trailingStart, end: trailingEnd })
            .groupBy('t.categoryId')
            .getRawMany();
        const trailingMap = new Map();
        trailingTotals.forEach((r) => trailingMap.set(r.categoryId, Number(r.value)));
        const alerts = lastMonthTotals
            .map((r) => {
            const current = Number(r.value);
            const trailing = trailingMap.get(r.categoryId) || 0;
            const avg = trailing / 3; // avg of previous 3 months
            const spike = avg > 0 ? (current - avg) / avg : current > 0 ? 1 : 0;
            return {
                categoryId: r.categoryId,
                current,
                spikePct: spike * 100
            };
        })
            .filter((r) => r.current > 50 && r.spikePct > 30)
            .sort((a, b) => b.spikePct - a.spikePct)
            .slice(0, 5);
        res.json({
            period: { start, end },
            totals: { income: incomeTotal, expense: expenseTotal, net, savingsRate },
            trend,
            expenseBreakdown: expenseBreakdown.map((r) => ({ name: r.name, value: Number(r.value), categoryId: r.categoryId })),
            incomeBreakdown: incomeBreakdown.map((r) => ({ name: r.name, value: Number(r.value), categoryId: r.categoryId })),
            paymentMethods: paymentMethods.map((r) => ({ name: r.name || 'Other', value: Number(r.value) })),
            topTransactions: topTransactions.map((t) => ({
                id: t.t_id || t.id,
                amount: Number(t.t_amount || t.amount),
                type: t.t_type || t.type,
                date: t.t_date || t.date,
                categoryName: t.c_name || t.name || 'Uncategorized',
                note: t.t_note || t.note || ''
            })),
            alerts
        });
    }
    catch (e) {
        console.error('overview error', e);
        res.status(500).json({ message: 'Error building analytics overview' });
    }
}
