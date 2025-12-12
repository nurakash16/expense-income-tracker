import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TransactionService } from '../../services/transaction.service';
import { CategoryService } from '../../services/category.service';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsCoreOption } from 'echarts/core';
import { KpiCardsComponent } from './kpi-cards.component';
import { AnalyticsService } from '../../services/analytics.service';
import { NgZone } from '@angular/core';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgxEchartsDirective, KpiCardsComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  stats = signal<any>(null);
  trendOption = signal<EChartsCoreOption>({});
  pieOption = signal<EChartsCoreOption>({});
  heatmapOption = signal<EChartsCoreOption>({});
  waterfallOption = signal<EChartsCoreOption>({});
  topCatsOption = signal<EChartsCoreOption>({});
  savingsGaugeOption = signal<EChartsCoreOption>({});
  weeklyTrendOption = signal<EChartsCoreOption>({});
  sparkNetOption = signal<EChartsCoreOption>({});
  budgetBarOption = signal<EChartsCoreOption>({});
  // User-configurable budget target (persisted locally)
  budgetTarget = signal<number>(Number(localStorage.getItem('budgetTarget') || 2500));
  filterType = signal<'all' | 'income' | 'expense'>('all');
  startMonth = signal<string>('');
  endMonth = signal<string>('');
  filterCategoryId = signal<string>('');
  filterPayment = signal<string>('');
  monthRange = signal<string>('');
  heatmapYear = signal<number>(new Date().getFullYear());

  categoryChoices = computed(() => {
    const t = this.filterType();
    const cats = this.cats.categories();
    if (t === 'all') return cats;
    return cats.filter((c: any) => c.type === 'both' || c.type === t);
  });
  private hasInit = false;

  constructor(public tx: TransactionService, public cats: CategoryService, private analytics: AnalyticsService) { }

  ngOnInit() {
    // Load only what's needed for dashboard when it mounts
    // Ensure categories are available for filter dropdown
    this.cats.getAll().subscribe({ error: () => {} });
    // Load stats (which also triggers analytics when done)
    this.reloadStats();
    this.reloadAnalytics();
    // Ensure charts update when transaction list changes (e.g., after add/delete)
    effect(() => {
      const _ = this.tx.transactions();
      const data = this.stats();
      if (data) this.initCharts(data);
    });
  }

  reloadStats() {
    const params: any = {};
    if (this.startMonth()) params.start = this.startMonth();
    if (this.endMonth()) params.end = this.endMonth();
    if (this.filterType() !== 'all') params.type = this.filterType();
    if (this.filterCategoryId()) params.categoryId = this.filterCategoryId();
    if (this.filterPayment()) params.paymentMethod = this.filterPayment();
    this.tx.getDashboardStats(params).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.initCharts(data);
        // Keep analytics in sync with the same filters
        this.reloadAnalytics();
      },
      error: (err) => console.error('Failed to load stats', err)
    });
  }

  reloadAnalytics() {
    // Heatmap for selected year
    this.analytics.heatmap(this.heatmapYear()).subscribe({
      next: (res) => this.initHeatmap(res),
      error: (e) => console.error('heatmap error', e)
    });
    // Waterfall uses same date range as dashboard filters (6 months default on server)
    const params: any = {};
    if (this.startMonth()) params.start = this.startMonth();
    if (this.endMonth()) params.end = this.endMonth();
    this.analytics.waterfall(params).subscribe({
      next: (res) => this.initWaterfall(res),
      error: (e) => console.error('waterfall error', e)
    });
    this.analytics.rollups(params).subscribe({
      next: (res) => this.initWeeklyTrend(res),
      error: (e) => console.error('rollups error', e)
    });
  }

  onChartInit(_: any) {
    // Force first-time render when component view finishes initializing
    if (!this.hasInit && this.stats()) {
      this.initCharts(this.stats());
    }
    this.hasInit = true;
  }

  // Template change handlers (avoid TS casts in templates)
  onFilterTypeChange(val: any) {
    this.filterType.set(val as 'all' | 'income' | 'expense');
  }
  onStartMonthChange(val: any) {
    this.startMonth.set(String(val || ''));
  }
  onEndMonthChange(val: any) {
    this.endMonth.set(String(val || ''));
  }
  onHeatmapYearChange(val: any) {
    const y = Number(val);
    if (!isNaN(y)) {
      this.heatmapYear.set(y);
      this.reloadAnalytics();
    }
  }

  // Accept a single input like "YYYY-MM - YYYY-MM" and split to start/end
  onMonthRangeChange(val: any) {
    const s = String(val || '').trim();
    this.monthRange.set(s);
    // Match formats: "YYYY-MM - YYYY-MM" / en-dash / "to"
    const m = s.match(/^(\d{4}-\d{2})\s*(?:-|–|to)\s*(\d{4}-\d{2})$/i);
    if (m) {
      this.startMonth.set(m[1]);
      this.endMonth.set(m[2]);
    }
  }

  initCharts(data: any) {
    // Trend Chart (Line/Bar)
    const months: string[] = (data?.trend?.months?.length ? data.trend.months : ['No data']);
    const incomes: number[] = (data?.trend?.income?.length ? data.trend.income : [0]);
    const expenses: number[] = (data?.trend?.expense?.length ? data.trend.expense : [0]);

    const option: EChartsCoreOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['Income', 'Expense'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLine: { lineStyle: { color: '#ccc' } }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed' } }
      },
      series: [
        {
          name: 'Income',
          type: 'bar',
          data: incomes,
          itemStyle: { color: '#10B981', borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 30
        },
        {
          name: 'Expense',
          type: 'bar',
          data: expenses,
          itemStyle: { color: '#EF4444', borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 30
        }
      ]
    };
    this.trendOption.set(option);

    // Pie Chart (Expense Categories)
    const pieDataRaw = data?.expenseByCategory ?? [];
    const pieData = pieDataRaw.length ? pieDataRaw.map((d: any) => ({ name: d.name, value: d.value })) : [{ name: 'No data', value: 1 }];
    const p: EChartsCoreOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        show: false
      },
      series: [
        {
          name: 'Expenses',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 18,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: pieData
        }
      ]
    };
    this.pieOption.set(p);

    // Top Categories Bar (use same category data)
    const bar: EChartsCoreOption = {
      grid: { left: 40, right: 10, top: 10, bottom: 30 },
      xAxis: { type: 'value' },
      yAxis: {
        type: 'category',
        data: (pieDataRaw.length ? pieDataRaw : [{ name: 'No data', value: 0 }]).map((d: any) => d.name).slice(0, 8).reverse(),
      },
      series: [
        {
          type: 'bar',
          data: (pieDataRaw.length ? pieDataRaw : [{ value: 0 }]).map((d: any) => d.value).slice(0, 8).reverse(),
          itemStyle: { color: '#4F46E5', borderRadius: [0, 6, 6, 0] },
          barMaxWidth: 14
        }
      ]
    };
    this.topCatsOption.set(bar);

    // Savings-rate Gauge (income vs expense)
    const ti = Number(data?.totals?.totalIncome || 0);
    const te = Number(data?.totals?.totalExpense || 0);
    const rate = ti > 0 ? Math.max(0, Math.min(1, (ti - te) / ti)) : 0;
    const gauge: EChartsCoreOption = {
      series: [
        {
          type: 'gauge',
          startAngle: 180, endAngle: 0, center: ['50%', '70%'], radius: '100%',
          min: 0, max: 1, splitNumber: 5,
          axisLine: { lineStyle: { width: 10, color: [[0.3, '#EF4444'], [0.7, '#F59E0B'], [1, '#10B981']] } },
          pointer: { show: true },
          detail: { formatter: (rate*100).toFixed(0) + '%', fontSize: 16 },
          data: [{ value: rate }]
        }
      ]
    };
    this.savingsGaugeOption.set(gauge);

    // Net sparkline (Income minus Expense over months)
    const netSeries = months.map((_, i) => (incomes[i] || 0) - (expenses[i] || 0));
    this.sparkNetOption.set({
      grid: { left: 0, right: 0, top: 10, bottom: 0 },
      xAxis: { type: 'category', data: months, boundaryGap: false, show: false },
      yAxis: { type: 'value', show: false },
      series: [{
        type: 'line',
        data: netSeries,
        smooth: true,
        areaStyle: { color: 'rgba(16,185,129,0.15)' },
        lineStyle: { color: '#10B981', width: 2 },
        symbol: 'none'
      }]
    });

    // Budget vs expense bar (user target)
    const target = this.budgetTarget();
    const expVal = te;
    this.budgetBarOption.set({
      grid: { left: 0, right: 0, top: 10, bottom: 0, containLabel: false },
      xAxis: { type: 'value', max: target * 1.1, show: false },
      yAxis: { type: 'category', data: [''], show: false },
      series: [
        { type: 'bar', data: [target], barWidth: 18, itemStyle: { color: '#E5E7EB' } },
        { type: 'bar', data: [expVal], barWidth: 12, itemStyle: { color: expVal <= target ? '#10B981' : '#EF4444' }, z: 2 }
      ]
    });
  }

  private initHeatmap(res: any) {
    const year = Number(res?.year) || new Date().getFullYear();
    const data = Array.isArray(res?.data) && res.data.length ? res.data : [[`${year}-01-01`, 0]];
    const option: EChartsCoreOption = {
      tooltip: { position: 'top' },
      visualMap: {
        min: 0,
        max: Math.max(1, ...data.map((d: any) => d[1] || 0)),
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0
      },
      calendar: [{
        top: 25,
        left: 10,
        right: 10,
        cellSize: [16, 16],
        range: String(year),
        itemStyle: { borderColor: '#eee' },
        yearLabel: { show: false }
      }],
      series: [{
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data
      }]
    };
    this.heatmapOption.set(option);
  }

  private initWaterfall(res: any) {
    const months: string[] = (res?.months?.length ? res.months : ['No data']);
    const income: number[] = (res?.income?.length ? res.income : [0]);
    const expense: number[] = (res?.expense?.length ? res.expense : [0]);
    const net: number[] = (res?.net?.length ? res.net : [0]);
    // Build assist baseline and increase/decrease bars
    const assist: number[] = [];
    let acc = 0;
    for (let i = 0; i < net.length; i++) {
      assist.push(acc);
      acc += net[i] || 0;
    }
    const inc = net.map(v => (v > 0 ? v : 0));
    const dec = net.map(v => (v < 0 ? -v : 0));
    const option: EChartsCoreOption = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { bottom: 0, data: ['Assist', 'Increase', 'Decrease'] },
      grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
      xAxis: { type: 'category', data: months },
      yAxis: { type: 'value' },
      series: [
        { name: 'Assist', type: 'bar', stack: 'total', itemStyle: { borderColor: 'transparent', color: 'transparent' }, data: assist },
        { name: 'Increase', type: 'bar', stack: 'total', itemStyle: { color: '#10B981' }, data: inc },
        { name: 'Decrease', type: 'bar', stack: 'total', itemStyle: { color: '#EF4444' }, data: dec }
      ]
    };
    this.waterfallOption.set(option);
  }

  private initWeeklyTrend(res: any) {
    const weeks: string[] = (res?.weeks?.length ? res.weeks : ['No data']);
    const income: number[] = (res?.income?.length ? res.income : [0]);
    const expense: number[] = (res?.expense?.length ? res.expense : [0]);
    const option: EChartsCoreOption = {
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0, data: ['Income', 'Expense'] },
      grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
      xAxis: { type: 'category', data: weeks },
      yAxis: { type: 'value' },
      series: [
        { name: 'Income', type: 'line', data: income, smooth: true, itemStyle: { color: '#10B981' } },
        { name: 'Expense', type: 'line', data: expense, smooth: true, itemStyle: { color: '#EF4444' } }
      ]
    };
    this.weeklyTrendOption.set(option);
  }

  // Use stats for totals if available, otherwise 0
  totalIncome = computed(() => this.stats()?.totals.totalIncome ?? 0);
  totalExpense = computed(() => this.stats()?.totals.totalExpense ?? 0);
  balance = computed(() => this.stats()?.totals.balance ?? 0);
  // Derived KPIs
  savingsRate = computed(() => {
    const inc = this.totalIncome();
    const exp = this.totalExpense();
    return inc > 0 ? Math.max(0, Math.min(1, (inc - exp) / inc)) : 0;
  });
  burnRate = computed(() => {
    const exp = this.totalExpense();
    const days = new Date().getDate();
    return days > 0 ? exp / days : 0;
  });
  avgTicket = computed(() => {
    const tx = this.tx.transactions();
    if (!tx.length) return 0;
    const sum = tx.reduce((s, t) => s + Number(t.amount || 0), 0);
    return sum / tx.length;
  });
  topIncomeTx = computed(() => {
    const tx = this.tx.transactions().filter(t => t.type === 'income');
    return tx.length ? tx.reduce((a, b) => (a.amount > b.amount ? a : b)) : null;
  });
  topExpenseTx = computed(() => {
    const tx = this.tx.transactions().filter(t => t.type === 'expense');
    return tx.length ? tx.reduce((a, b) => (a.amount > b.amount ? a : b)) : null;
  });
  transactionCount = computed(() => this.tx.transactions().length);
  // Month-over-month deltas based on trend data
  momIncome = computed(() => {
    const trend = this.stats()?.trend;
    const arr: number[] = trend?.income ?? [];
    if (arr.length < 2) return 0;
    const last = arr[arr.length - 1] || 0;
    const prev = arr[arr.length - 2] || 0;
    return prev === 0 ? (last === 0 ? 0 : 100) : ((last - prev) / prev) * 100;
  });
  momExpense = computed(() => {
    const trend = this.stats()?.trend;
    const arr: number[] = trend?.expense ?? [];
    if (arr.length < 2) return 0;
    const last = arr[arr.length - 1] || 0;
    const prev = arr[arr.length - 2] || 0;
    return prev === 0 ? (last === 0 ? 0 : 100) : ((last - prev) / prev) * 100;
  });
  // Balance health bar: use savings rate
  balanceHealth = computed(() => {
    const rate = this.savingsRate();
    return {
      label: rate >= 0.2 ? 'Healthy financial status' : rate >= 0 ? 'Needs attention' : 'Deficit',
      percent: Math.min(100, Math.max(0, rate * 100))
    };
  });

  updateBudgetTarget(val: any) {
    const n = Number(val);
    if (isNaN(n) || n <= 0) return;
    this.budgetTarget.set(n);
    localStorage.setItem('budgetTarget', String(n));
    // Rebuild budget bar with new target
    if (this.stats()) {
      this.initCharts(this.stats());
    }
  }

  // Keep recent from the transaction list logic
  recent = computed(() => this.tx.transactions().slice(0, 5));

  categoryName(categoryId: string): string {
    return this.cats.categories().find((c: any) => c.id === categoryId)?.name ?? 'Unknown';
  }

  // Data for recent list and categories is already loaded by services' constructors.
}
