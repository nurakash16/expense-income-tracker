import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  signal,
  computed,
  effect,
  CUSTOM_ELEMENTS_SCHEMA,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { TransactionService } from '../../services/transaction.service';
import { CategoryService } from '../../services/category.service';
import { AnalyticsService } from '../../services/analytics.service';
import { ApiClientService } from '../../services/api-client.service';
import { DateContextService } from '../../services/date-context.service';
import { DashboardDataService } from '../../services/dashboard-data.service';

import { MonthlySummaryComponent } from '../../components/monthly-summary/monthly-summary.component';

import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MonthlySummaryComponent,
    MatIconModule,
    MatMenuModule,
    MatButtonModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  Math = Math;

  private kpi = signal<any>(null);
  private monthly = signal<any>(null);
  private heatmapData = signal<any>(null);
  private waterfall = signal<any>(null);
  private analyticsLoading = false;

  filterType = signal<'all' | 'income' | 'expense'>('all');

  private dateCtx = inject(DateContextService);
  monthsBack = this.dateCtx.monthsBack;
  startMonth = signal<string>(''); // YYYY-MM
  endMonth = signal<string>('');   // YYYY-MM

  currentMonth = this.dateCtx.month; // YYYY-MM

  public tx = inject(TransactionService);
  public cats = inject(CategoryService);
  private analytics = inject(AnalyticsService);
  private api = inject(ApiClientService);
  private dashData = inject(DashboardDataService);
  lastSynced = signal<Date | null>(null);

  ngOnInit() {
    // Ensure shared defaults are set before using signals
    this.dateCtx.ensureDefaults();
    // Ensure we have a valid current month on load
    if (!this.currentMonth()) {
      this.dateCtx.setMonth(this.dateCtx.currentMonthStr());
    }
    if (!this.monthsBack()) {
      this.dateCtx.setMonthsBack(6);
    }
    this.applyRangeFromCurrent();

    // Kick off an initial load (will use whatever cached data exists)
    this.loadDataOnce();

    // Prime data: categories + transactions, then load analytics once both complete
    forkJoin({
      cats: this.cats.getAll().pipe(catchError(() => of([]))),
      tx: this.tx.getAll(undefined, { force: true }).pipe(catchError(() => of([]))),
    }).subscribe(() => {
      this.loadDataOnce();
    });

  }

  private loadDataOnce() {
    this.reloadKpi();
    this.reloadMonthlyInsights();
    this.reloadHeatmap();
    this.reloadWaterfall();
  }

  periodLabel = computed(() => {
    const s = this.startMonth();
    const e = this.endMonth();
    const mb = this.monthsBack();
    if (!s || !e) return `Last ${mb} months`;
    return `${s} → ${e}`;
  });

  onRangeChange(n: number) {
    this.dateCtx.setMonthsBack(n);
    this.applyRangeFromCurrent();
    this.loadDataOnce();
  }

  onMonthChange(month: string) {
    const val = month || this.dateCtx.currentMonthStr();
    this.dateCtx.setMonth(val);
    this.applyRangeFromCurrent();
    this.loadDataOnce();
  }

  overview = computed(() => {
    const d = this.kpi();
    const m = this.monthly();

    if (!d && !m) return null;

    const monthlyIncome = Number(m?.current?.income ?? m?.summary?.income ?? 0);
    const monthlyExpense = Number(m?.current?.expense ?? m?.summary?.expense ?? 0);

    const income = Number(d?.totals?.income ?? d?.totals?.totalIncome ?? monthlyIncome ?? 0);
    const expense = Number(d?.totals?.expense ?? d?.totals?.totalExpense ?? monthlyExpense ?? 0);
    const net = Number(d?.totals?.net ?? (income - expense));

    return { ...d, totals: { ...d.totals, income, expense, net } };
  });

  savingsRate = computed(() => {
    const o = this.overview();
    if (!o) return 0;
    const inc = Number(o.totals?.income || 0);
    const exp = Number(o.totals?.expense || 0);
    if (inc <= 0) return 0;
    return Math.max(0, Math.min(100, ((inc - exp) / inc) * 100));
  });

  heatmap = computed(() => this.heatmapData());
  monthlyInsights = computed(() => this.monthly());
  savingsHistory = computed(() => {
    const wf = this.waterfall();
    const months: string[] = wf?.months || [];
    const income: number[] = wf?.income || [];
    const expense: number[] = wf?.expense || [];
    return months.map((m, i) => ({
      month: m,
      savings: Number(income[i] || 0) - Number(expense[i] || 0)
    }));
  });

  currentTotals = computed(() => ({
    income: Number(this.monthly()?.current?.income || 0),
    expense: Number(this.monthly()?.current?.expense || 0),
  }));

  deltaIncome = computed(() => {
    const m = this.monthly();
    return Number(m?.current?.income || 0) - Number(m?.previous?.income || 0);
  });

  deltaExpense = computed(() => {
    const m = this.monthly();
    return Number(m?.current?.expense || 0) - Number(m?.previous?.expense || 0);
  });

  getCategoryName = (categoryId: string) => {
    return this.cats.categories().find((c: any) => c.id === categoryId)?.name || 'Unknown';
  };

  alertsList = computed(() => {
    const m = this.monthly();
    const list: any[] = m?.categoryDetails || [];
    return list.filter(x => !!x.isUnusual);
  });

  periodTransactionCount = computed(() => this.filteredTransactions().length);

  latestTransactionDate = computed(() => {
    const txs = this.filteredTransactions();
    if (!txs.length) return '';
    const latest = txs.reduce((acc: string, t: any) => {
      const d = String(t.date || '');
      return d > acc ? d : acc;
    }, '');
    return latest;
  });

  recentTransactionsCount = computed(() => {
    const txs = this.filteredTransactions();
    if (!txs.length) return 0;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return txs.filter((t: any) => new Date(t.date || '') >= cutoff).length;
  });

  averageDailyExpense = computed(() => {
    const txs = this.filteredTransactions().filter((t: any) => t.type === 'expense');
    if (!txs.length) return 0;
    const start = this.startMonth();
    const end = this.endMonth();
    if (!start || !end) return 0;
    const startDate = new Date(`${start}-01`);
    const endDate = new Date(`${end}-01`);
    const lastDay = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
    const days = Math.max(1, Math.round((lastDay.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const total = txs.reduce((sum, t: any) => sum + Number(t.amount || 0), 0);
    return total / days;
  });

  topSpendingCategory = computed(() => {
    const top = this.breakdownByCategory('expense')[0];
    if (!top) return { name: 'No expenses', value: 0 };
    return top;
  });

  topTransactions = computed(() => {
    const txs = this.filteredTransactions();
    return [...txs]
      .sort((a: any, b: any) => Math.abs(Number(b.amount || 0)) - Math.abs(Number(a.amount || 0)))
      .slice(0, 6)
      .map((t: any) => ({
        ...t,
        categoryName: this.getCategoryName(t.categoryId)
      }));
  });

  expenseBreakdown = computed(() => this.breakdownByCategory('expense'));
  incomeBreakdown = computed(() => this.breakdownByCategory('income'));
  previousSavingsTotal = computed(() => {
    const list = this.savingsHistory();
    if (!list.length) return 0;
    return list.slice(0, -1).reduce((sum, row) => sum + row.savings, 0);
  });

  topSavingsMonth = computed(() => {
    const list = this.savingsHistory();
    if (!list.length) return null;
    return list.reduce((best, row) => (best && best.savings >= row.savings) ? best : row);
  });

  lastSavingsMonth = computed(() => {
    const list = this.savingsHistory();
    if (!list.length) return null;
    return list[list.length - 1];
  });

  private reloadKpi() {
    const params: any = {};

    // convert YYYY-MM to real date range
    const s = this.startMonth();
    const e = this.endMonth();

    if (s) params.start = `${s}-01`;
    if (e) params.end = this.endOfMonth(e); // YYYY-MM-DD (last day)

    if (this.filterType() !== 'all') params.type = this.filterType();

    this.dashData.getKpi(params).subscribe({
      next: (data) => {
        this.kpi.set(data);
        this.lastSynced.set(new Date());
      },
      error: (err) => {
        console.error('Failed to load KPI', err);
        this.kpi.set(null);
      }
    });
  }

private endOfMonth(yyyyMM: string) {
  const [y, m] = yyyyMM.split('-').map(Number);
  const last = new Date(y, m, 0); // day 0 of next month = last day of current month
  const mm = String(m).padStart(2, '0');
  const dd = String(last.getDate()).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}


  private reloadMonthlyInsights() {
    const month = this.currentMonth() || this.dateCtx.currentMonthStr();
    const apiMonth = month.endsWith('-01') ? month : `${month}-01`;

    this.dashData.getMonthly(apiMonth).subscribe({
      next: (res) => this.monthly.set(res),
      error: (err) => {
        console.error('Failed to load monthly insights', err);
        this.monthly.set(null);
      }
    });
  }

  private reloadHeatmap() {
    const month = this.currentMonth() || this.dateCtx.currentMonthStr();
    const year = month.slice(0, 4) || new Date().getFullYear();
    this.dashData.getHeatmap(year).subscribe({
      next: (res) => this.heatmapData.set(res),
      error: () => this.heatmapData.set(null)
    });
  }

  private reloadWaterfall() {
    const params: any = {};
    if (this.startMonth()) params.start = this.startMonth();
    if (this.endMonth()) params.end = this.endMonth();
    this.api.get<any>('/analytics/waterfall', { params }).subscribe({
      next: (res) => this.waterfall.set(res),
      error: () => this.waterfall.set(null)
    });
  }

  private applyRangeFromCurrent() {
    const anchor = this.currentMonth() || this.dateCtx.currentMonthStr(); // YYYY-MM
    const [y, m] = anchor.split('-').map(Number);
    const months = this.monthsBack() || 6;
    const end = anchor;
    const startDate = new Date(y, (m || 1) - 1 - (months - 1), 1);
    const start = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

    this.startMonth.set(start);
    this.endMonth.set(end);
  }

  private filteredTransactions() {
    const all = this.tx.transactions() || [];
    const type = this.filterType();
    const s = this.startMonth();
    const e = this.endMonth();

    return all.filter((t: any) => {
      if (type !== 'all' && t.type !== type) return false;
      const m = String(t.date || '').slice(0, 7);
      if (s && m < s) return false;
      if (e && m > e) return false;
      return true;
    });
  }

  private breakdownByCategory(kind: 'income' | 'expense') {
    const txs = this.filteredTransactions().filter((t: any) => t.type === kind);

    const map = new Map<string, number>();
    for (const t of txs) {
      const id = String(t.categoryId || '');
      map.set(id, (map.get(id) || 0) + Number(t.amount || 0));
    }

    // template expects { name, value }
    return [...map.entries()]
      .map(([categoryId, total]) => ({
        categoryId,
        name: this.getCategoryName(categoryId),
        value: total
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }

  get lastSyncedLabel(): string {
    const d = this.lastSynced();
    if (!d) return 'Not synced yet';
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  get latestTxLabel(): string {
    const d = this.latestTransactionDate();
    if (!d) return 'No transactions';
    return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  get avgDailyExpenseLabel(): string {
    return this.averageDailyExpense().toLocaleString(undefined, { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 });
  }

  get topSpendingCategoryLabel(): string {
    const top = this.topSpendingCategory();
    return `${top.name} · ${top.value.toLocaleString(undefined, { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 })}`;
  }

  get previousSavingsLabel(): string {
    return this.previousSavingsTotal().toLocaleString(undefined, { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 });
  }

  get topSavingsLabel(): string {
    const t = this.topSavingsMonth();
    if (!t) return 'No data';
    return `${t.month} · ${t.savings.toLocaleString(undefined, { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 })}`;
  }

  get lastSavingsLabel(): string {
    const t = this.lastSavingsMonth();
    if (!t) return 'No data';
    return `${t.month} · ${t.savings.toLocaleString(undefined, { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 })}`;
  }

  rangeSavings = computed(() => Number(this.overview()?.totals?.net || 0));

  get savingsBalanceLabel(): string {
    return this.rangeSavings().toLocaleString(undefined, { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 });
  }
}
