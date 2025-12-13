import { AppDataSource } from '../config/db';
import { Transaction } from '../entities/Transaction';
import { WeeklyRollup } from '../entities/WeeklyRollup';

export async function getHeatmap(req: any, res: any) {
  try {
    const repo = AppDataSource.getRepository(Transaction);
    const userId = req.user.id;
    const year = String((req.query.year as string) || new Date().getFullYear());
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;
    const rows = await repo
      .createQueryBuilder('t')
      .select('t.date', 'date')
      .addSelect("SUM(CASE WHEN t.type='expense' THEN t.amount ELSE 0 END)", 'value')
      .where('t.userId = :userId', { userId })
      .andWhere('t.date BETWEEN :start AND :end', { start, end })
      .groupBy('t.date')
      .orderBy('t.date', 'ASC')
      .getRawMany();
    const data = rows.map((r: any) => [r.date, Number(r.value)]);
    res.json({ year, data });
  } catch (e) {
    console.error('heatmap error', e);
    res.status(500).json({ message: 'Error building heatmap' });
  }
}

export async function getWaterfall(req: any, res: any) {
  try {
    const repo = AppDataSource.getRepository(Transaction);
    const userId = req.user.id;
    const { start, end } = req.query as any; // YYYY-MM
    const months: string[] = [];
    const toMonth = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const endDate = end ? new Date(`${end}-01`) : new Date();
    const startDate = start ? new Date(`${start}-01`) : new Date(endDate.getFullYear(), endDate.getMonth() - 5, 1);
    let d = new Date(startDate);
    while (d <= endDate) {
      months.push(toMonth(d));
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
    const rows = await repo
      .createQueryBuilder('t')
      .select("SUBSTRING(t.date FROM 1 FOR 7)", 'month')
      .addSelect("SUM(CASE WHEN t.type='income' THEN t.amount ELSE 0 END)", 'income')
      .addSelect("SUM(CASE WHEN t.type='expense' THEN t.amount ELSE 0 END)", 'expense')
      .where('t.userId = :userId', { userId })
      .andWhere('t.date BETWEEN :start AND :end', { start: `${months[0]}-01`, end: `${months[months.length - 1]}-31` })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();
    const byMonth = new Map<string, { income: number; expense: number }>();
    rows.forEach((r: any) => byMonth.set(r.month, { income: Number(r.income), expense: Number(r.expense) }));
    const income = months.map((m) => byMonth.get(m)?.income ?? 0);
    const expense = months.map((m) => byMonth.get(m)?.expense ?? 0);
    const net = months.map((_, i) => income[i] - expense[i]);
    res.json({ months, income, expense, net });
  } catch (e) {
    console.error('waterfall error', e);
    res.status(500).json({ message: 'Error building waterfall' });
  }
}

export async function getRollups(req: any, res: any) {
  try {
    const repo = AppDataSource.getRepository(WeeklyRollup);
    const userId = req.user.id;
    const { start, end } = req.query as any; // YYYY-MM-DD
    const qb = repo.createQueryBuilder('w').where('w.userId = :userId', { userId });
    if (start) qb.andWhere('w.weekStart >= :start', { start });
    if (end) qb.andWhere('w.weekStart <= :end', { end });
    const rows = await qb.orderBy('w.weekStart', 'ASC').getMany();
    const weeks = rows.map(r => r.weekStart);
    const income = rows.map(r => r.incomeTotal);
    const expense = rows.map(r => r.expenseTotal);
    const balance = rows.map(r => r.balance);
    res.json({ weeks, income, expense, balance });
  } catch (e) {
    console.error('rollups error', e);
    res.status(500).json({ message: 'Error fetching rollups' });
  }
}

// New Insights Endpoints reading from MonthlyRollup
import { MonthlyRollup } from '../entities/MonthlyRollup';

export async function getMonthlyInsights(req: any, res: any) {
  try {
    const repo = AppDataSource.getRepository(MonthlyRollup);
    const userId = req.user.id;
    const { month } = req.query; // YYYY-MM-01 format expected

    if (!month) {
      return res.status(400).json({ message: 'Month parameter (YYYY-MM-01) is required' });
    }

    const currentMonth = month as string;
    // Calculate previous month
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() - 1);
    const prevMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;

    const currentData = await repo.find({ where: { userId, month: currentMonth } });
    const prevData = await repo.find({ where: { userId, month: prevMonth } });

    // Summarize totals
    const currentTotal = currentData.reduce((acc, r) => ({
      income: acc.income + Number(r.totalIncome),
      expense: acc.expense + Number(r.totalExpense)
    }), { income: 0, expense: 0 });

    const prevTotal = prevData.reduce((acc, r) => ({
      income: acc.income + Number(r.totalIncome),
      expense: acc.expense + Number(r.totalExpense)
    }), { income: 0, expense: 0 });

    // Compare categories
    const categoriesDiff = currentData.map(c => {
      const prev = prevData.find(p => p.categoryId === c.categoryId);
      const prevExpense = prev ? Number(prev.totalExpense) : 0;
      const currExpense = Number(c.totalExpense);
      const diff = currExpense - prevExpense;
      const pct = prevExpense > 0 ? (diff / prevExpense) * 100 : (currExpense > 0 ? 100 : 0);

      return {
        categoryId: c.categoryId,
        current: currExpense,
        previous: prevExpense,
        diff,
        pct,
        isUnusual: currExpense > (prevExpense * 1.3) && currExpense > 50 // Simple threshold: 30% more and absolute > 50
      };
    });

    // Sort by biggest absolute increase
    categoriesDiff.sort((a, b) => b.diff - a.diff);

    res.json({
      current: currentTotal,
      previous: prevTotal,
      delta: {
        income: currentTotal.income - prevTotal.income,
        expense: currentTotal.expense - prevTotal.expense
      },
      categoryDetails: categoriesDiff
    });

  } catch (e) {
    console.error('insights error', e);
    res.status(500).json({ message: 'Error fetching insights' });
  }
}
