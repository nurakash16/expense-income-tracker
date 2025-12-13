"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listNotifications = listNotifications;
exports.unreadCount = unreadCount;
exports.markRead = markRead;
exports.markAllRead = markAllRead;
const db_1 = require("../config/db");
const Notification_1 = require("../entities/Notification");
async function listNotifications(req, res) {
    const userId = req.user.id;
    const take = Math.min(Number(req.query.take) || 50, 200);
    const skip = Math.max(Number(req.query.skip) || 0, 0);
    const repo = db_1.AppDataSource.getRepository(Notification_1.Notification);
    const [items, total] = await repo.findAndCount({
        where: { userId },
        order: { createdAt: 'DESC' },
        take,
        skip,
    });
    res.json({ items, total, take, skip });
}
async function unreadCount(req, res) {
    const userId = req.user.id;
    const repo = db_1.AppDataSource.getRepository(Notification_1.Notification);
    const count = await repo.count({
        where: { userId, readAt: null },
    });
    res.json({ count });
}
async function markRead(req, res) {
    const userId = req.user.id;
    const { id } = req.params;
    const repo = db_1.AppDataSource.getRepository(Notification_1.Notification);
    const notif = await repo.findOneBy({ id, userId });
    if (!notif)
        return res.status(404).json({ message: 'Notification not found' });
    notif.readAt = new Date();
    await repo.save(notif);
    res.json({ message: 'OK' });
}
async function markAllRead(req, res) {
    const userId = req.user.id;
    const repo = db_1.AppDataSource.getRepository(Notification_1.Notification);
    await repo
        .createQueryBuilder()
        .update(Notification_1.Notification)
        .set({ readAt: () => 'now()' })
        .where("\"userId\" = :userId", { userId })
        .andWhere("\"readAt\" is null")
        .execute();
    res.json({ message: 'OK' });
}
