"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSettings = getSettings;
exports.updateSettings = updateSettings;
const db_1 = require("../config/db");
const UserSettings_1 = require("../entities/UserSettings");
async function getSettings(req, res) {
    try {
        const repo = db_1.AppDataSource.getRepository(UserSettings_1.UserSettings);
        let settings = await repo.findOne({ where: { userId: req.user.id } });
        if (!settings) {
            // Return defaults if not exists, do not create yet
            return res.json({
                theme: 'system',
                currency: 'BDT',
                accentColor: '#6200ee',
                notificationPrefs: { unusualSpending: true, budgetAlerts: true, largeTransactions: true }
            });
        }
        res.json(settings);
    }
    catch (error) {
        console.error('getSettings error:', error);
        res.status(500).json({ message: 'Error fetching settings' });
    }
}
async function updateSettings(req, res) {
    try {
        const repo = db_1.AppDataSource.getRepository(UserSettings_1.UserSettings);
        let settings = await repo.findOne({ where: { userId: req.user.id } });
        if (!settings) {
            settings = new UserSettings_1.UserSettings();
            settings.userId = req.user.id;
        }
        repo.merge(settings, req.body);
        await repo.save(settings);
        res.json(settings);
    }
    catch (error) {
        console.error('updateSettings error:', error);
        res.status(500).json({ message: 'Error updating settings' });
    }
}
