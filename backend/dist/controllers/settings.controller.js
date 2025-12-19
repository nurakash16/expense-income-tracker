"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSettings = getSettings;
exports.updateSettings = updateSettings;
exports.getAccount = getAccount;
exports.updateAccount = updateAccount;
exports.changePassword = changePassword;
const db_1 = require("../config/db");
const UserSettings_1 = require("../entities/UserSettings");
const User_1 = require("../entities/User");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
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
        // Only allow theme + currency updates
        const allowed = {};
        if (req.body.theme)
            allowed.theme = String(req.body.theme);
        if (req.body.currency)
            allowed.currency = String(req.body.currency);
        repo.merge(settings, allowed);
        await repo.save(settings);
        res.json(settings);
    }
    catch (error) {
        console.error('updateSettings error:', error);
        res.status(500).json({ message: 'Error updating settings' });
    }
}
async function getAccount(req, res) {
    try {
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOneBy({ id: req.user.id });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        res.json({ email: user.email, displayName: user.displayName || '' });
    }
    catch (error) {
        console.error('getAccount error:', error);
        res.status(500).json({ message: 'Error fetching account' });
    }
}
async function updateAccount(req, res) {
    try {
        const { displayName } = req.body || {};
        const name = String(displayName || '').trim();
        if (name.length === 0)
            return res.status(400).json({ message: 'Display name required' });
        if (name.length > 80)
            return res.status(400).json({ message: 'Display name too long' });
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOneBy({ id: req.user.id });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        user.displayName = name;
        await userRepo.save(user);
        res.json({ email: user.email, displayName: user.displayName });
    }
    catch (error) {
        console.error('updateAccount error:', error);
        res.status(500).json({ message: 'Error updating account' });
    }
}
async function changePassword(req, res) {
    try {
        const { currentPassword, newPassword } = req.body || {};
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new password required' });
        }
        if (String(newPassword).length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOneBy({ id: req.user.id });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const ok = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        if (!ok)
            return res.status(401).json({ message: 'Current password is incorrect' });
        const hash = await bcryptjs_1.default.hash(newPassword, 10);
        user.passwordHash = hash;
        await userRepo.save(user);
        res.json({ message: 'Password updated' });
    }
    catch (error) {
        console.error('changePassword error:', error);
        res.status(500).json({ message: 'Error changing password' });
    }
}
