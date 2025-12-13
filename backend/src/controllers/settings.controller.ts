import { AppDataSource } from '../config/db';
import { UserSettings } from '../entities/UserSettings';

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

        repo.merge(settings, req.body);
        await repo.save(settings);
        res.json(settings);
    } catch (error) {
        console.error('updateSettings error:', error);
        res.status(500).json({ message: 'Error updating settings' });
    }
}
