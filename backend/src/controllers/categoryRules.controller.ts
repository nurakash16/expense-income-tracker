import { AppDataSource } from '../config/db';
import { CategoryRule } from '../entities/CategoryRule';

export async function listRules(req: any, res: any) {
    const userId = req.user.id;
    const repo = AppDataSource.getRepository(CategoryRule);

    const items = await repo.find({
        where: { userId },
        order: { priority: 'ASC', createdAt: 'ASC' },
    });

    res.json({ items });
}

export async function createRule(req: any, res: any) {
    const userId = req.user.id;
    const { categoryId, pattern, isRegex, priority } = req.body;

    if (!categoryId || !pattern) {
        return res.status(400).json({ message: 'categoryId and pattern are required' });
    }

    const repo = AppDataSource.getRepository(CategoryRule);
    const rule = repo.create({
        userId,
        categoryId,
        pattern: String(pattern).trim(),
        isRegex: Boolean(isRegex),
        priority: Number(priority) || 100,
    });

    await repo.save(rule);
    res.json({ item: rule });
}

export async function deleteRule(req: any, res: any) {
    const userId = req.user.id;
    const { id } = req.params;

    const repo = AppDataSource.getRepository(CategoryRule);
    const rule = await repo.findOneBy({ id, userId });
    if (!rule) return res.status(404).json({ message: 'Rule not found' });

    await repo.remove(rule);
    res.json({ message: 'OK' });
}
