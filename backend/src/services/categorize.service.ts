import { AppDataSource } from '../config/db';
import { CategoryRule } from '../entities/CategoryRule';

export async function pickCategoryFromRules(userId: string, text: string) {
    const repo = AppDataSource.getRepository(CategoryRule);
    const rules = await repo.find({
        where: { userId },
        order: { priority: 'ASC', createdAt: 'ASC' },
    });

    const hay = (text || '').toLowerCase().trim();
    if (!hay) return null;

    for (const r of rules) {
        if (!r.pattern) continue;

        if (r.isRegex) {
            try {
                const re = new RegExp(r.pattern, 'i');
                if (re.test(text)) return r.categoryId;
            } catch {
                // ignore bad regex
            }
        } else {
            if (hay.includes(r.pattern.toLowerCase())) return r.categoryId;
        }
    }

    return null;
}
