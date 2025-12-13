"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
require("../config/env");
const db_1 = require("../config/db");
const Category_1 = require("../entities/Category");
async function main() {
    try {
        await (0, db_1.connectDB)();
        console.log('✅ Connected to DB');
        const repo = db_1.AppDataSource.getRepository(Category_1.Category);
        // Check metadata to see if TypeORM knows about budget
        const metadata = db_1.AppDataSource.getMetadata(Category_1.Category);
        const budgetCol = metadata.columns.find(c => c.propertyName === 'budget');
        console.log('Metadata has budget column:', !!budgetCol);
        // Try to fetch one to see if SQL fails
        const cat = await repo.findOne({ where: {} });
        console.log('Successfully fetched a category:', cat ? 'Yes' : 'No (Table empty)');
        if (cat) {
            console.log('Sample Category:', JSON.stringify(cat, null, 2));
        }
    }
    catch (e) {
        console.error('❌ Error checking DB:', e);
    }
    finally {
        if (db_1.AppDataSource.isInitialized)
            await db_1.AppDataSource.destroy();
    }
}
main();
