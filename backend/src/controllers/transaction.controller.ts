import { AppDataSource } from '../config/db';
import { Transaction, TransactionType } from '../entities/Transaction';
import { Category, CategoryType } from '../entities/Category';
import ExcelJS from 'exceljs';
import multer from 'multer';

export async function getTransactions(req: any, res: any) {
    try {
        const transactionRepo = AppDataSource.getRepository(Transaction);
        const { type, start, end, q, categoryId, paymentMethod, min, max } = req.query as any;

        const qb = transactionRepo.createQueryBuilder('t')
            .leftJoinAndSelect('t.category', 'c')
            .where('t.userId = :userId', { userId: req.user.id });

        if (type && (type === 'income' || type === 'expense')) {
            qb.andWhere('t.type = :type', { type });
        }
        if (start) {
            qb.andWhere('t.date >= :start', { start });
        }
        if (end) {
            qb.andWhere('t.date <= :end', { end });
        }
        if (q) {
            qb.andWhere('(t.note ILIKE :q OR CAST(t.amount AS TEXT) ILIKE :q OR c.name ILIKE :q)', { q: `%${q}%` });
        }
        if (categoryId) {
            qb.andWhere('t.categoryId = :categoryId', { categoryId });
        }
        if (paymentMethod) {
            qb.andWhere('t.paymentMethod = :paymentMethod', { paymentMethod });
        }
        if (min !== undefined) {
            qb.andWhere('t.amount >= :min', { min: Number(min) });
        }
        if (max !== undefined) {
            qb.andWhere('t.amount <= :max', { max: Number(max) });
        }

        const list = await qb.orderBy('t.date', 'DESC').getMany();
        res.json(list);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching transactions' });
    }
}

export async function createTransaction(req: any, res: any) {
    try {
        const { type, amount, categoryId, date, note, paymentMethod } = req.body || {};
        if (!['income', 'expense'].includes(type)) return res.status(400).json({ message: 'Invalid type' });
        if (typeof amount !== 'number' || isNaN(amount)) return res.status(400).json({ message: 'Invalid amount' });
        if (!categoryId) return res.status(400).json({ message: 'categoryId required' });
        if (!date) return res.status(400).json({ message: 'date required (YYYY-MM-DD)' });

        const transactionRepo = AppDataSource.getRepository(Transaction);
        const categoryRepo = AppDataSource.getRepository(Category);
        const tx = transactionRepo.create({
            type,
            amount,
            categoryId,
            date,
            note,
            paymentMethod,
            userId: req.user.id,
        });
        await transactionRepo.save(tx);
        res.json(tx);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating transaction' });
    }
}

export async function deleteTransaction(req: any, res: any) {
    try {
        const transactionRepo = AppDataSource.getRepository(Transaction);
        const result = await transactionRepo.delete({ id: req.params.id, userId: req.user.id });

        if (result.affected === 0) {
            return res.status(404).json({ message: 'Transaction not found or unauthorized' });
        }

        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting transaction' });
    }
}

export async function updateTransaction(req: any, res: any) {
    try {
        const transactionRepo = AppDataSource.getRepository(Transaction);
        const categoryRepo = AppDataSource.getRepository(Category);
        const existing = await transactionRepo.findOneBy({ id: req.params.id, userId: req.user.id });
        if (!existing) return res.status(404).json({ message: 'Transaction not found or unauthorized' });

        const { type, amount, categoryId, date, note, paymentMethod } = req.body || {};
        if (type && !['income', 'expense'].includes(type)) return res.status(400).json({ message: 'Invalid type' });
        if (amount !== undefined && (typeof amount !== 'number' || isNaN(amount))) return res.status(400).json({ message: 'Invalid amount' });

        if (categoryId) {
            const cat = await categoryRepo.findOneBy({ id: categoryId, userId: req.user.id });
            if (!cat) return res.status(400).json({ message: 'Invalid category' });
        }

        Object.assign(existing, {
            type: type ?? existing.type,
            amount: amount ?? existing.amount,
            categoryId: categoryId ?? existing.categoryId,
            date: date ?? existing.date,
            note: note ?? existing.note,
            paymentMethod: paymentMethod ?? existing.paymentMethod,
        });

        const saved = await transactionRepo.save(existing);
        res.json(saved);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating transaction' });
    }
}

export async function getDashboardStats(req: any, res: any) {
    try {
        const repo = AppDataSource.getRepository(Transaction);
        const userId = req.user.id;
        // Optional filters: start (YYYY-MM), end (YYYY-MM)
        const { start, end } = req.query as any;
        const toMonthStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const endDate = end ? new Date(`${end}-01`) : new Date();
        const months: string[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
            months.push(toMonthStr(d));
        }
        const startBoundary = (start ? `${start}-01` : `${months[0]}-01`);
        const endBoundary = `${months[months.length - 1]}-31`;

        // 1. Calculate Totals (Income vs Expense) with optional filters
        const totalsQB = repo.createQueryBuilder('t')
            .select('t.type', 'type')
            .addSelect('SUM(t.amount)', 'total')
            .where('t.userId = :userId', { userId })
            .andWhere('t.date BETWEEN :start AND :end', { start: startBoundary, end: endBoundary });
        if (req.query.type && ['income', 'expense'].includes(req.query.type)) {
            totalsQB.andWhere('t.type = :tfilter', { tfilter: req.query.type });
        }
        if (req.query.categoryId) totalsQB.andWhere('t.categoryId = :categoryId', { categoryId: req.query.categoryId });
        if (req.query.paymentMethod) totalsQB.andWhere('t.paymentMethod = :paymentMethod', { paymentMethod: req.query.paymentMethod });
        const totals = await totalsQB.groupBy('t.type').getRawMany();

        const totalIncome = Number(totals.find(t => t.type === 'income')?.total || 0);
        const totalExpense = Number(totals.find(t => t.type === 'expense')?.total || 0);

        // 2. Breakdown by Category for selected type (default to expense)
        const breakType = (req.query.type === 'income' || req.query.type === 'expense') ? req.query.type : 'expense';
        const catQB = repo.createQueryBuilder('t')
            .leftJoin('t.category', 'c')
            .select('c.name', 'name')
            .addSelect('SUM(t.amount)', 'value')
            .where('t.userId = :userId', { userId })
            .andWhere('t.type = :type', { type: breakType })
            .andWhere('t.date BETWEEN :start AND :end', { start: startBoundary, end: endBoundary });
        if (req.query.categoryId) catQB.andWhere('t.categoryId = :categoryId', { categoryId: req.query.categoryId });
        if (req.query.paymentMethod) catQB.andWhere('t.paymentMethod = :paymentMethod', { paymentMethod: req.query.paymentMethod });
        const expensesByCategory = await catQB.groupBy('c.name').orderBy('value', 'DESC').getRawMany();

        const expenseByCategory = expensesByCategory.map(e => ({
            name: e.name || 'Uncategorized',
            value: Number(e.value)
        }));

        // 3. Last 6 Months Trend
        // Use substring on stored YYYY-MM-DD string to get YYYY-MM
        const monthExpr = "SUBSTRING(t.date FROM 1 FOR 7)";
        const trendQB = repo.createQueryBuilder('t')
            .select(monthExpr, "month")
            .addSelect("SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END)", "income")
            .addSelect("SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END)", "expense")
            .where('t.userId = :userId', { userId })
            .andWhere('t.date BETWEEN :start AND :end', { start: startBoundary, end: endBoundary });
        if (req.query.type && ['income', 'expense'].includes(req.query.type)) trendQB.andWhere('t.type = :tfilter', { tfilter: req.query.type });
        if (req.query.categoryId) trendQB.andWhere('t.categoryId = :categoryId', { categoryId: req.query.categoryId });
        if (req.query.paymentMethod) trendQB.andWhere('t.paymentMethod = :paymentMethod', { paymentMethod: req.query.paymentMethod });
        const rawTrend = await trendQB.groupBy(monthExpr).orderBy(monthExpr, 'ASC').getRawMany();

        // Fill zero values for months with no data
        const byMonth = new Map<string, { income: number; expense: number }>();
        rawTrend.forEach((r: any) => byMonth.set(r.month, { income: Number(r.income), expense: Number(r.expense) }));
        const trend = {
            months,
            income: months.map(m => byMonth.get(m)?.income ?? 0),
            expense: months.map(m => byMonth.get(m)?.expense ?? 0),
        };

        res.json({
            totals: {
                totalIncome,
                totalExpense,
                balance: totalIncome - totalExpense
            },
            expenseByCategory,
            trend
        });

    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ message: 'Error processing stats' });
    }
}

export async function exportExcel(req: any, res: any) {
    try {
        const transactionRepo = AppDataSource.getRepository(Transaction);
        const data = await transactionRepo.find({
            where: { userId: req.user.id },
            order: { date: 'DESC' },
            relations: ['category']
        });

        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Transactions');

        ws.columns = [
            { header: 'Type', key: 'type', width: 10 },
            { header: 'Category', key: 'category', width: 15 },
            { header: 'Amount', key: 'amount', width: 12 },
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Note', key: 'note', width: 30 },
            { header: 'Payment Method', key: 'paymentMethod', width: 15 },
        ];

        data.forEach(t => {
            ws.addRow({
                type: t.type,
                category: t.category?.name || '',
                amount: t.amount,
                date: t.date,
                note: t.note,
                paymentMethod: t.paymentMethod || 'cash'
            });
        });

        res.setHeader(
            'Content-Disposition',
            'attachment; filename=transactions.xlsx'
        );
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        await wb.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Excel export error:', error);
        res.status(500).json({ message: 'Error exporting excel' });
    }
}

// CSV export (aligned with import format)
export async function exportCsv(req: any, res: any) {
    try {
        const transactionRepo = AppDataSource.getRepository(Transaction);
        const data = await transactionRepo.find({
            where: { userId: req.user.id },
            order: { date: 'DESC' },
            relations: ['category']
        });
        const escape = (v?: string | number) => {
            if (v === undefined || v === null) return '';
            const s = String(v).replace(/"/g, '""');
            return `"${s}"`;
        };
        const lines = data.map(t =>
            [t.type, t.category?.name || '', t.amount, t.date, t.note || '', t.paymentMethod || '']
                .map(escape)
                .join(',')
        ).join('\n');
        res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
        res.setHeader('Content-Type', 'text/csv');
        res.send(`Type,Category,Amount,Date,Note,PaymentMethod\n${lines}`);
    } catch (error) {
        console.error('CSV export error:', error);
        res.status(500).json({ message: 'Error exporting CSV' });
    }
}

export async function importCsv(req: any, res: any) {
    try {
        const userId = req.user.id;
        const file: Express.Multer.File | undefined = (req as any).file;
        const dryRun = String(req.query.dryRun || req.query.dryrun || 'false').toLowerCase() === 'true';
        if (!file) return res.status(400).json({ message: 'file required' });
        const text = file.buffer.toString('utf8');

        // Simple CSV split that respects quotes
        const rows: string[][] = [];
        const lines = text.split(/\r?\n/);
        for (const line of lines) {
            if (!line.trim()) continue;
            const cols: string[] = [];
            let cur = '';
            let inQ = false;
            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if (ch === '"') {
                    // Toggle quote, handle escaped quotes
                    if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else { inQ = !inQ; }
                } else if (ch === ',' && !inQ) {
                    cols.push(cur.trim()); cur = '';
                } else {
                    cur += ch;
                }
            }
            cols.push(cur.trim());
            rows.push(cols.map(c => c.replace(/^"|"$/g, '')));
        }
        if (!rows.length) return res.json({ imported: 0 });

        const header = rows.shift()!.map(s => s.trim().toLowerCase());
        const idx = (names: string[]) => names.map(n => header.indexOf(n)).find(i => i >= 0) ?? -1;
        const iType = idx(['type']);
        const iAmount = idx(['amount']);
        const iDate = idx(['date']);
        const iCategoryId = idx(['categoryid', 'category_id', 'category id']);
        const iCategoryName = idx(['category', 'categoryname', 'category_name']);
        const iNote = idx(['note', 'memo']);
        const iPayment = idx(['paymentmethod', 'method']);
        if (iType < 0 || iAmount < 0 || iDate < 0) {
            return res.status(400).json({ message: 'Required columns: type, amount, date. Optional: categoryId|category, note, paymentMethod' });
        }
        const txRepo = AppDataSource.getRepository(Transaction);
        const catRepo = AppDataSource.getRepository(Category);

        let imported = 0; const errors: any[] = []; let createdCategories = 0;
        const findOrCreateCategory = async (name: string, type: 'income' | 'expense') => {
            let cat = await catRepo.findOne({ where: { userId, name } });
            if (!cat) {
                if (dryRun) { createdCategories++; return { id: 'dry-run' } as any; }
                cat = catRepo.create({ userId, name, type: type as CategoryType });
                await catRepo.save(cat);
                createdCategories++;
            }
            return cat;
        };

        const normalizeDate = (s: string) => {
            const t = s.trim();
            if (!t) return '';
            // If already YYYY-MM-DD
            const m = t.match(/^(\d{4})[-\/](\d{2})[-\/](\d{2})$/);
            if (m) return `${m[1]}-${m[2]}-${m[3]}`;
            // Try MM/DD/YYYY or DD/MM/YYYY -> use Date parse
            const d = new Date(t);
            if (!isNaN(d.getTime())) {
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${d.getFullYear()}-${mm}-${dd}`;
            }
            return t; // fallback
        };

        for (let r = 0; r < rows.length; r++) {
            const parts = rows[r];
            const type = (parts[iType] || '').trim().toLowerCase() as 'income' | 'expense';
            const amount = Number((parts[iAmount] || '').toString().replace(/[^0-9.\-]/g, ''));
            const date = normalizeDate(parts[iDate] || '');
            let categoryId = iCategoryId >= 0 ? (parts[iCategoryId] || '').trim() : '';
            const categoryName = iCategoryName >= 0 ? (parts[iCategoryName] || '').trim() : '';
            const note = iNote >= 0 ? (parts[iNote] || '').trim() : undefined;
            const paymentMethod = iPayment >= 0 ? (parts[iPayment] || '').trim() : undefined;

            if (!['income', 'expense'].includes(type) || !isFinite(amount) || !date) {
                errors.push({ line: r + 2, message: 'invalid row' });
                continue;
            }
            if (!categoryId && categoryName) {
                const cat = await findOrCreateCategory(categoryName, type);
                categoryId = (cat as any).id;
            }
            if (!categoryId && !dryRun) {
                errors.push({ line: r + 2, message: 'missing categoryId/category' });
                continue;
            }
            if (dryRun) { imported++; continue; }
            const tx = txRepo.create({ userId, type: type as TransactionType, amount, date, categoryId: categoryId as any, note, paymentMethod });
            await txRepo.save(tx);
            imported++;
        }
        res.json({ imported, createdCategories, errors, dryRun });
    } catch (e) {
        console.error('importCsv error', e);
        res.status(500).json({ message: 'Error importing CSV' });
    }
}
