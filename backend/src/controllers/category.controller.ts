import { AppDataSource } from '../config/db';
import { Category } from '../entities/Category';

export async function getCategories(req: any, res: any) {
    try {
        const categoryRepo = AppDataSource.getRepository(Category);
        const list = await categoryRepo.find({
            where: { userId: req.user.id },
            order: { createdAt: 'DESC' }
        });
        res.json(list);
    } catch (error) {
        console.error('getCategories error:', error);
        res.status(500).json({ message: 'Error fetching categories' });
    }
}

export async function createCategory(req: any, res: any) {
    try {
        const { name, type, budget } = req.body;
        if (!name) return res.status(400).json({ message: 'name required' });
        if (!['income', 'expense', 'both'].includes(type)) return res.status(400).json({ message: 'invalid type' });
        const categoryRepo = AppDataSource.getRepository(Category);

        const cat = categoryRepo.create({
            userId: req.user.id,
            name,
            type,
            budget: budget ? Number(budget) : 0
        });
        await categoryRepo.save(cat);
        res.json(cat);
    } catch (error) {
        console.error('createCategory error:', error);
        res.status(500).json({ message: 'Error creating category' });
    }
}

export async function deleteCategory(req: any, res: any) {
    try {
        const categoryRepo = AppDataSource.getRepository(Category);
        const result = await categoryRepo.delete({ id: req.params.id, userId: req.user.id });

        if (result.affected === 0) {
            return res.status(404).json({ message: 'Category not found or unauthorized' });
        }

        res.json({ message: 'Deleted' });
    } catch (error) {
        console.error('deleteCategory error:', error);
        res.status(500).json({ message: 'Error deleting category' });
    }
}

export async function updateCategory(req: any, res: any) {
    try {
        const { name, type, budget } = req.body;
        const categoryRepo = AppDataSource.getRepository(Category);
        const cat = await categoryRepo.findOne({ where: { id: req.params.id, userId: req.user.id } });

        if (!cat) {
            return res.status(404).json({ message: 'Category not found' });
        }

        if (name) cat.name = name;
        if (type) cat.type = type;
        if (budget !== undefined) cat.budget = Number(budget);

        await categoryRepo.save(cat);
        res.json(cat);
    } catch (error) {
        console.error('updateCategory error:', error);
        res.status(500).json({ message: 'Error updating category' });
    }
}
