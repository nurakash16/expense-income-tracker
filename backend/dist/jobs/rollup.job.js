"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeWeeklyRollups = computeWeeklyRollups;
exports.scheduleWeeklyRollupJob = scheduleWeeklyRollupJob;
const db_1 = require("../config/db");
const Transaction_1 = require("../entities/Transaction");
const WeeklyRollup_1 = require("../entities/WeeklyRollup");
function mondayOf(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0 Sun..6 Sat
    const diff = (day === 0 ? -6 : 1) - day; // back to Monday
    const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
    return `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, '0')}-${String(mon.getDate()).padStart(2, '0')}`;
}
async function computeWeeklyRollups() {
    const txRepo = db_1.AppDataSource.getRepository(Transaction_1.Transaction);
    const rollRepo = db_1.AppDataSource.getRepository(WeeklyRollup_1.WeeklyRollup);
    // Fetch all weeks per user in transactions
    const rows = await txRepo.createQueryBuilder('t')
        .select('t.userId', 'userId')
        .addSelect("SUBSTRING(t.date FROM 1 FOR 10)", 'day')
        .addSelect("SUM(CASE WHEN t.type='income' THEN t.amount ELSE 0 END)", 'income')
        .addSelect("SUM(CASE WHEN t.type='expense' THEN t.amount ELSE 0 END)", 'expense')
        .groupBy('t.userId')
        .addGroupBy('day')
        .orderBy('t.userId', 'ASC')
        .addOrderBy('day', 'ASC')
        .getRawMany();
    const byUserWeek = new Map();
    for (const r of rows) {
        const week = mondayOf(new Date(r.day));
        const key = `${r.userid}:${week}`;
        const prev = byUserWeek.get(key) || { income: 0, expense: 0 };
        prev.income += Number(r.income || 0);
        prev.expense += Number(r.expense || 0);
        byUserWeek.set(key, prev);
    }
    for (const [key, val] of byUserWeek.entries()) {
        const [userId, weekStart] = key.split(':');
        const entity = rollRepo.create({
            userId,
            weekStart,
            incomeTotal: val.income,
            expenseTotal: val.expense,
            balance: val.income - val.expense,
        });
        await rollRepo.upsert(entity, { conflictPaths: ['userId', 'weekStart'] });
    }
}
function scheduleWeeklyRollupJob() {
    // run on startup and then every 24h
    computeWeeklyRollups().catch(() => { });
    setInterval(() => computeWeeklyRollups().catch(() => { }), 24 * 60 * 60 * 1000);
}
