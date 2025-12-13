"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSalary = getSalary;
exports.upsertSalary = upsertSalary;
const db_1 = require("../config/db");
const MonthlySalary_1 = require("../entities/MonthlySalary");
const typeorm_1 = require("typeorm");
async function getSalary(req, res) {
    try {
        const { month } = req.query; // YYYY-MM
        if (!month)
            return res.status(400).json({ message: 'Month required' });
        const salaryRepo = db_1.AppDataSource.getRepository(MonthlySalary_1.MonthlySalary);
        // Find exact match
        let salary = await salaryRepo.findOne({
            where: { userId: req.user.id, month }
        });
        if (!salary) {
            // Find latest salary before this month (Carry Forward)
            const lastSalary = await salaryRepo.findOne({
                where: { userId: req.user.id, month: (0, typeorm_1.LessThanOrEqual)(month) },
                order: { month: 'DESC' }
            });
            // If we found a past salary, return it (but strictly speaking, the UI might want to know if it's inherited or explicit. 
            // For now, let's return the Amount. If no past salary, return 0.
            return res.json({
                amount: lastSalary ? Number(lastSalary.amount) : 0,
                isInherited: !salary && !!lastSalary,
                sourceMonth: lastSalary?.month
            });
        }
        res.json({ amount: Number(salary.amount), isInherited: false, sourceMonth: salary.month });
    }
    catch (error) {
        console.error('getSalary error:', error);
        res.status(500).json({ message: 'Error fetching salary' });
    }
}
async function upsertSalary(req, res) {
    try {
        const { month, amount } = req.body;
        if (!month || amount === undefined)
            return res.status(400).json({ message: 'Month and amount required' });
        const salaryRepo = db_1.AppDataSource.getRepository(MonthlySalary_1.MonthlySalary);
        let salary = await salaryRepo.findOne({
            where: { userId: req.user.id, month }
        });
        if (salary) {
            salary.amount = amount;
            await salaryRepo.save(salary);
        }
        else {
            salary = salaryRepo.create({
                userId: req.user.id,
                month,
                amount
            });
            await salaryRepo.save(salary);
        }
        res.json(salary);
    }
    catch (error) {
        console.error('upsertSalary error:', error);
        res.status(500).json({ message: 'Error saving salary' });
    }
}
