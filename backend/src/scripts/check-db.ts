import 'reflect-metadata';
import '../config/env';
import { AppDataSource, connectDB } from '../config/db';
import { Category } from '../entities/Category';

async function main() {
    try {
        await connectDB();
        console.log('✅ Connected to DB');

        const repo = AppDataSource.getRepository(Category);

        // Check metadata to see if TypeORM knows about budget
        const metadata = AppDataSource.getMetadata(Category);
        const budgetCol = metadata.columns.find(c => c.propertyName === 'budget');
        console.log('Metadata has budget column:', !!budgetCol);

        // Try to fetch one to see if SQL fails
        const cat = await repo.findOne({ where: {} });
        console.log('Successfully fetched a category:', cat ? 'Yes' : 'No (Table empty)');

        if (cat) {
            console.log('Sample Category:', JSON.stringify(cat, null, 2));
        }

    } catch (e) {
        console.error('❌ Error checking DB:', e);
    } finally {
        if (AppDataSource.isInitialized) await AppDataSource.destroy();
    }
}

main();
