import { AppDataSource } from '../config/db';
import { Notification } from '../entities/Notification';

export async function listNotifications(req: any, res: any) {
    const userId = req.user.id;
    const take = Math.min(Number(req.query.take) || 50, 200);
    const skip = Math.max(Number(req.query.skip) || 0, 0);

    const repo = AppDataSource.getRepository(Notification);

    const [items, total] = await repo.findAndCount({
        where: { userId },
        order: { createdAt: 'DESC' },
        take,
        skip,
    });

    res.json({ items, total, take, skip });
}

export async function unreadCount(req: any, res: any) {
    const userId = req.user.id;
    const repo = AppDataSource.getRepository(Notification);

    const count = await repo.count({
        where: { userId, readAt: null },
    });

    res.json({ count });
}

export async function markRead(req: any, res: any) {
    const userId = req.user.id;
    const { id } = req.params;

    const repo = AppDataSource.getRepository(Notification);

    const notif = await repo.findOneBy({ id, userId });
    if (!notif) return res.status(404).json({ message: 'Notification not found' });

    notif.readAt = new Date();
    await repo.save(notif);

    res.json({ message: 'OK' });
}

export async function markAllRead(req: any, res: any) {
    const userId = req.user.id;
    const repo = AppDataSource.getRepository(Notification);

    await repo
        .createQueryBuilder()
        .update(Notification)
        .set({ readAt: () => 'now()' })
        .where("\"userId\" = :userId", { userId })
        .andWhere("\"readAt\" is null")
        .execute();

    res.json({ message: 'OK' });
}
