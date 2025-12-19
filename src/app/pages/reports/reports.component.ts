import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';

import { ApiClientService } from '../../services/api-client.service';
import { AnalyticsService } from '../../services/analytics.service';
import { CategoryService } from '../../services/category.service';
import { StorageService } from '../../services/storage.service';
import { DateContextService } from '../../services/date-context.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  standalone: true,
  selector: 'app-reports',
  imports: [CommonModule, FormsModule, NgxEchartsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent {
  // Controls
  monthsBack = signal<number>(6);
  selectedMonth = signal<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Data
  kpi = signal<any>(null);        // GET /api/kpi
  waterfall = signal<any>(null);  // GET /analytics/waterfall
  heatmap = signal<any>(null);    // GET /analytics/heatmap
  monthly = signal<any>(null);    // GET /analytics/monthly
  daily = signal<Array<{ date: string; income: number; expense: number }>>([]);
  heatmapView = signal<'year' | 'month'>('year');

  loading = signal(false);

  constructor(
    private api: ApiClientService,
    private analytics: AnalyticsService,
    private cats: CategoryService,
    private storage: StorageService,
    private dateCtx: DateContextService,
    private themeService: ThemeService
  ) {
    // hydrate shared date context before using its signals
    this.dateCtx.ensureDefaults();
    // bind to shared signals AFTER ensureDefaults to avoid uninitialized access
    this.monthsBack = this.dateCtx.monthsBack;
    this.selectedMonth = this.dateCtx.month;
    const storedMonth = this.storage.get<string>('GLOBAL_SELECTED_MONTH', this.dateCtx.currentMonthStr());
    this.selectedMonth.set(storedMonth || this.dateCtx.currentMonthStr());
    this.cats.getAll().subscribe({ error: () => {} });
    this.loadAll();
  }

  onRange(n: number) {
    this.monthsBack.set(n);
    this.loadAll();
  }

  onMonthChange(val: string) {
    const month = val || this.dateCtx.currentMonthStr();
    this.selectedMonth.set(month);
    this.dateCtx.setMonth(month);
    this.storage.set('GLOBAL_SELECTED_MONTH', month);
    this.loadAll();
  }

  loadAll() {
    this.loading.set(true);

    const { startYM, endYM } = this.rangeMonths(this.monthsBack());
    const start = `${startYM}-01`;
    const end = this.endOfMonth(endYM);
    const monthStart = `${this.selectedMonth()}-01`;
    const monthEnd = this.endOfMonth(this.selectedMonth());

    // KPI (totals + topExpenseCategories)
    this.analytics.kpis({ start, end }).subscribe({
      next: (d) => this.kpi.set(d),
      error: () => this.kpi.set(null),
    });

    // Waterfall (months/income/expense/net)
    this.api.get<any>('/analytics/waterfall', { params: { start: startYM, end: endYM } }).subscribe({
      next: (d) => this.waterfall.set(d),
      error: () => this.waterfall.set(null),
    });

    // Monthly insights
    const m = `${this.selectedMonth()}-01`;
    this.api.get<any>(`/analytics/monthly?month=${m}`).subscribe({
      next: (d) => this.monthly.set(d),
      error: () => this.monthly.set(null),
    });

    // Heatmap
    const year = this.selectedMonth().slice(0, 4);
    this.api.get<any>(`/analytics/heatmap?year=${year}`).subscribe({
      next: (d) => this.heatmap.set(d),
      error: () => this.heatmap.set(null),
      complete: () => this.loading.set(false),
    });

    // Daily income/expense for selected month
    this.api.get<any[]>('/transactions', { params: { start: monthStart, end: monthEnd } }).subscribe({
      next: (list) => {
        const map = new Map<string, { income: number; expense: number }>();
        (list || []).forEach((t: any) => {
          const d = String(t.date || '').slice(0, 10);
          if (!map.has(d)) {
            map.set(d, { income: 0, expense: 0 });
          }
          const entry = map.get(d)!;
          const amt = Number(t.amount || 0);
          if (t.type === 'income') entry.income += amt;
          if (t.type === 'expense') entry.expense += amt;
        });
        // Fill missing days with zeros
        const [year, monthNum] = this.selectedMonth().split('-').map(Number);
        const daysInMonth = new Date(year, monthNum, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          if (!map.has(dateStr)) {
            map.set(dateStr, { income: 0, expense: 0 });
          }
        }
        const sorted = Array.from(map.entries())
          .sort(([a], [b]) => (a > b ? 1 : -1))
          .map(([date, v]) => ({ date, income: v.income, expense: v.expense }));
        this.daily.set(sorted);
      },
      error: () => this.daily.set([])
    });
  }

  alerts = computed(() => {
    const list: any[] = this.monthly()?.categoryDetails || [];
    return list.filter(x => !!x.isUnusual).slice(0, 10);
  });

  // ECharts options (responsive + aligned)
  barOpt = computed((): EChartsOption => {
    const isDark = this.themeService.theme() === 'dark';
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const gridLine = isDark ? 'rgba(148,163,184,0.2)' : 'rgba(148,163,184,0.35)';
    const wf = this.waterfall();
    const months: string[] = wf?.months || [];
    const income: number[] = wf?.income || [];
    const expense: number[] = wf?.expense || [];

    return {
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0, textStyle: { color: textColor } },
      grid: { left: '6%', right: '4%', top: 20, bottom: 50, containLabel: true },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: { rotate: months.length > 8 ? 35 : 0, color: textColor }
      },
      yAxis: { type: 'value', axisLabel: { color: textColor }, splitLine: { lineStyle: { color: gridLine } } },
      color: ['#10b981', '#f97316'],
      series: [
        { name: 'Income', type: 'bar', data: income, itemStyle: { borderRadius: [6,6,0,0], color: '#10b981' } },
        { name: 'Expense', type: 'bar', data: expense, itemStyle: { borderRadius: [6,6,0,0], color: '#f97316' } },
      ],
      media: [{
        query: { maxWidth: 520 },
        option: { grid: { left: '10%', bottom: 60 }, legend: { top: 0, bottom: null } }
      }]
    };
  });

  donutOpt = computed((): EChartsOption => {
    const isDark = this.themeService.theme() === 'dark';
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const borderColor = isDark ? '#0f172a' : '#fff';
    const raw = (this.kpi()?.topExpenseCategories || []).slice(0, 20);
    const typeById = new Map<string, string>();
    const typeByName = new Map<string, string>();
    (this.cats.categories() || []).forEach((c: any) => {
      if (c?.id) typeById.set(String(c.id), String(c.type || '').toLowerCase());
      if (c?.name) typeByName.set(String(c.name).toLowerCase(), String(c.type || '').toLowerCase());
    });
    const data = raw.filter((d: any) => {
      const id = d?.categoryId ?? d?.id;
      const name = String(d?.name || '').toLowerCase();
      const type = id ? typeById.get(String(id)) : typeByName.get(name);
      return type ? type !== 'income' : true;
    }).slice(0, 10);
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, type: 'scroll', textStyle: { color: textColor } },
      color: ['#2563eb', '#10b981', '#f97316', '#a855f7', '#f43f5e', '#14b8a6', '#f59e0b', '#0ea5e9'],
      series: [{
        type: 'pie',
        radius: ['48%', '74%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 10, borderColor, borderWidth: 2 },
        label: { show: false },
        data
      }]
    };
  });

  heatmapOpt = computed((): EChartsOption => {
    const isDark = this.themeService.theme() === 'dark';
    const textColor = isDark ? '#e5e7eb' : '#111827';
    const mutedText = isDark ? '#94a3b8' : '#6b7280';
    const borderColor = isDark ? 'rgba(148,163,184,0.22)' : '#d1d5db';
    const lineColor = isDark ? 'rgba(148,163,184,0.25)' : '#94a3b8';
    const h = this.heatmap();
    const year = String(h?.year || new Date().getFullYear());
    const raw = Array.isArray(h?.data) ? h.data : [];
    const view = this.heatmapView();
    const fullYearRange: string[] = [`${year}-01-01`, `${year}-12-31`];
    let range: string | string[] = fullYearRange;
    let data = raw;
    if (view === 'month') {
      const month = this.selectedMonth();
      range = month;
      data = raw.filter((d: any) => String(d[0] || '').startsWith(month));
    }
    data = data.filter((d: any) => Number(d?.[1] || 0) > 0);
    const maxValue = 10000;

    return {
      backgroundColor: isDark ? '#0f172a' : 'transparent',
      tooltip: { position: 'top' },
      visualMap: {
        min: 0, max: Math.max(1, maxValue),
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        top: 0,
        inRange: {
          color: isDark
            ? ['#1f2937', '#f97316', '#fbbf24']
            : ['#fff7ed', '#fb923c', '#7c2d12']
        }
      },
      calendar: {
        top: 120,
        left: 10,
        right: 10,
        cellSize: ['auto', view === 'month' ? 48 : 40],
        range,
        yearLabel: { show: false },
        monthLabel: { fontSize: 12, color: textColor, fontWeight: 700, margin: 18 },
        dayLabel: { firstDay: 1, nameMap: 'en', color: mutedText, fontSize: 11 },
        itemStyle: { borderWidth: 1, borderColor, color: isDark ? '#111827' : '#ffffff' },
        splitLine: { show: true, lineStyle: { color: lineColor, width: 2 } }
      },
      series: {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data,
        label: {
          show: true,
          formatter: (p: any) => String(p.data[0]).slice(-2),
          color: isDark ? '#f8fafc' : '#0f172a',
          fontSize: view === 'month' ? 12 : 10,
          textBorderColor: isDark ? 'rgba(15,23,42,0.75)' : 'rgba(255,255,255,0.85)',
          textBorderWidth: 2
        }
      }
    };
  });

  dailyOpt = computed((): EChartsOption => {
    const isDark = this.themeService.theme() === 'dark';
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const gridLine = isDark ? 'rgba(148,163,184,0.2)' : 'rgba(148,163,184,0.35)';
    const series = this.daily();
    const days = series.map((d) => d.date.slice(-2));
    const income = series.map((d) => d.income);
    const expense = series.map((d) => d.expense);
    return {
      tooltip: { trigger: 'axis' },
      legend: { top: 0, textStyle: { color: textColor } },
      grid: { left: '6%', right: '4%', top: 40, bottom: 40, containLabel: true },
      xAxis: { type: 'category', data: days, boundaryGap: true, axisLabel: { color: textColor } },
      yAxis: { type: 'value', axisLabel: { color: textColor }, splitLine: { lineStyle: { color: gridLine } } },
      color: ['#10b981', '#ef4444'],
      series: [
        { name: 'Income', type: 'bar', data: income, itemStyle: { color: '#10b981', borderRadius: [4,4,0,0] } },
        { name: 'Expense', type: 'bar', data: expense, itemStyle: { color: '#ef4444', borderRadius: [4,4,0,0] } },
      ]
    };
  });

  // Helpers
  catName(id: string) {
    return this.cats.categories().find(c => c.id === id)?.name || 'Uncategorized';
  }
  private rangeMonths(n: number) {
    const now = new Date();
    const endYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const startDate = new Date(now.getFullYear(), now.getMonth() - (n - 1), 1);
    const startYM = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
    return { startYM, endYM };
  }

  private endOfMonth(yyyyMM: string) {
    const [y, m] = yyyyMM.split('-').map(Number);
    const last = new Date(y, m, 0);
    const mm = String(m).padStart(2, '0');
    const dd = String(last.getDate()).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }
}
