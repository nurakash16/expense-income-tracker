import { AppDataSource } from '../config/db';
import { UserSettings } from '../entities/UserSettings';
import { User } from '../entities/User';
import bcrypt from 'bcryptjs';

export async function getSettings(req: any, res: any) {
    try {
        const repo = AppDataSource.getRepository(UserSettings);
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
    } catch (error) {
        console.error('getSettings error:', error);
        res.status(500).json({ message: 'Error fetching settings' });
    }
}

export async function updateSettings(req: any, res: any) {
    try {
        const repo = AppDataSource.getRepository(UserSettings);
        let settings = await repo.findOne({ where: { userId: req.user.id } });

        if (!settings) {
            settings = new UserSettings();
            settings.userId = req.user.id;
        }

        // Only allow theme + currency updates
        const allowed: Partial<UserSettings> = {};
        if (req.body.theme) allowed.theme = String(req.body.theme);
        if (req.body.currency) allowed.currency = String(req.body.currency);

        repo.merge(settings, allowed);
        await repo.save(settings);
        res.json(settings);
    } catch (error) {
        console.error('updateSettings error:', error);
        res.status(500).json({ message: 'Error updating settings' });
    }
}

export async function getAccount(req: any, res: any) {
    try {
        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOneBy({ id: req.user.id });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ email: user.email, displayName: user.displayName || '' });
    } catch (error) {
        console.error('getAccount error:', error);
        res.status(500).json({ message: 'Error fetching account' });
    }
}

export async function updateAccount(req: any, res: any) {
    try {
        const { displayName } = req.body || {};
        const name = String(displayName || '').trim();
        if (name.length === 0) return res.status(400).json({ message: 'Display name required' });
        if (name.length > 80) return res.status(400).json({ message: 'Display name too long' });

        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOneBy({ id: req.user.id });
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.displayName = name;
        await userRepo.save(user);
        res.json({ email: user.email, displayName: user.displayName });
    } catch (error) {
        console.error('updateAccount error:', error);
        res.status(500).json({ message: 'Error updating account' });
    }
}

export async function changePassword(req: any, res: any) {
    try {
        const { currentPassword, newPassword } = req.body || {};
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new password required' });
        }
        if (String(newPassword).length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOneBy({ id: req.user.id });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const ok = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!ok) return res.status(401).json({ message: 'Current password is incorrect' });

        const hash = await bcrypt.hash(newPassword, 10);
        user.passwordHash = hash;
        await userRepo.save(user);
        res.json({ message: 'Password updated' });
    } catch (error) {
        console.error('changePassword error:', error);
        res.status(500).json({ message: 'Error changing password' });
    }
}
