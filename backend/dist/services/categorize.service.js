"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickCategoryFromRules = pickCategoryFromRules;
const db_1 = require("../config/db");
const CategoryRule_1 = require("../entities/CategoryRule");
async function pickCategoryFromRules(userId, text) {
    const repo = db_1.AppDataSource.getRepository(CategoryRule_1.CategoryRule);
    const rules = await repo.find({
        where: { userId },
        order: { priority: 'ASC', createdAt: 'ASC' },
    });
    const hay = (text || '').toLowerCase().trim();
    if (!hay)
        return null;
    for (const r of rules) {
        if (!r.pattern)
            continue;
        if (r.isRegex) {
            try {
                const re = new RegExp(r.pattern, 'i');
                if (re.test(text))
                    return r.categoryId;
            }
            catch {
                // ignore bad regex
            }
        }
        else {
            if (hay.includes(r.pattern.toLowerCase()))
                return r.categoryId;
        }
    }
    return null;
}
