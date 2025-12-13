import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { ApiClientService } from '../../services/api-client.service';
import { CategoryService } from '../../services/category.service';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard-charts',
  standalone: true,
  imports: [CommonModule, NgxEchartsModule, MatCardModule, MatProgressBarModule, MatIconModule],
  template: `
    <div class="row g-4">
      <!-- Row 1: Income vs Expense (Stacked Bar) -->
      <div class="col-12 col-lg-7">
        <mat-card class="glass-card h-100">
          <div class="p-3 border-bottom">
            <h6 class="m-0 fw-bold text-muted">Income vs Expense (Last 6 Months)</h6>
          </div>
          <div class="p-3" style="height: 300px;">
            <div echarts [options]="incomeExpenseChart()" class="w-100 h-100"></div>
          </div>
        </mat-card>
      </div>

      <!-- Row 1: Expense Breakdown (Donut) -->
      <div class="col-12 col-lg-5">
        <mat-card class="glass-card h-100">
          <div class="p-3 border-bottom">
            <h6 class="m-0 fw-bold text-muted">Expense Breakdown (Top Categories)</h6>
          </div>
          <div class="p-3" style="height: 300px;">
            <div echarts [options]="expenseDonutChart()" class="w-100 h-100"></div>
          </div>
        </mat-card>
      </div>

      <!-- Row 2: Insights (Changes & Alerts) -->
      <div class="col-12 col-md-6">
        <mat-card class="glass-card h-100">
          <div class="p-3 border-bottom d-flex align-items-center gap-2">
             <mat-icon class="text-primary">trending_up</mat-icon>
             <h6 class="m-0 fw-bold text-muted">Biggest Changes (vs Last Month)</h6>
          </div>
          <div class="p-3">
             <div *ngIf="insights()?.monthOverMonth?.length === 0" class="text-center text-muted py-4">
               No significant changes.
             </div>
             <div *ngFor="let item of insights()?.monthOverMonth | slice:0:3" class="mb-3">
               <div class="d-flex justify-content-between align-items-center mb-1">
                 <span class="fw-medium">{{ $any(item).categoryName }}</span>
                 <span [class.text-danger]="$any(item).diff > 0" [class.text-success]="$any(item).diff < 0">
                   {{ $any(item).diff > 0 ? '+' : '' }}{{ $any(item).diff | currency:'BDT' }}
                   <small class="opacity-75">({{ $any(item).percentChange }}%)</small>
                 </span>
               </div>
               <mat-progress-bar mode="determinate" [value]="Math.abs($any(item).percentChange)" 
                 [color]="$any(item).diff > 0 ? 'warn' : 'primary'" style="height: 6px; border-radius: 3px;">
               </mat-progress-bar>
             </div>
          </div>
        </mat-card>
      </div>

      <div class="col-12 col-md-6">
        <mat-card class="glass-card h-100">
          <div class="p-3 border-bottom d-flex align-items-center gap-2">
             <mat-icon class="text-warn">warning</mat-icon>
             <h6 class="m-0 fw-bold text-muted">Unusual Spending Alerts</h6>
          </div>
          <div class="p-3">
            <div *ngIf="insights()?.unusualSpending?.length === 0" class="text-center text-muted py-4">
              <mat-icon class="fs-1 opacity-25">check_circle</mat-icon>
              <p>Everything looks normal.</p>
            </div>
            <div *ngFor="let alert of insights()?.unusualSpending" class="alert alert-light border-start border-4 border-warning d-flex gap-3 align-items-center mb-2 p-2">
               <mat-icon class="text-warning">notifications_active</mat-icon>
               <div class="lh-sm">
                 <div class="fw-bold">{{ $any(alert).categoryName }}</div>
                 <small class="text-muted">Higher than your 3-month average.</small>
               </div>
            </div>
          </div>
        </mat-card>
      </div>

      <!-- Row 3: Budget Progress -->
      <div class="col-12">
        <mat-card class="glass-card">
          <div class="p-3 border-bottom">
            <h6 class="m-0 fw-bold text-muted">Budget Progress (Top Categories)</h6>
          </div>
          <div class="p-3">
             <div class="row g-3">
               <div *ngFor="let item of budgetProgress()" class="col-12 col-md-6">
                 <div class="d-flex justify-content-between small mb-1">
                   <span>{{ item.name }}</span>
                   <span [class]="'text-' + getBudgetColorClass(item.percent)">
                     {{ item.spend | currency:'BDT' }} / {{ item.budget | currency:'BDT' }}
                   </span>
                 </div>
                 <mat-progress-bar mode="determinate" [value]="item.percent" 
                   [class]="'custom-progress-' + getBudgetColorClass(item.percent)"
                   style="height: 8px; border-radius: 4px;">
                 </mat-progress-bar>
               </div>
             </div>
          </div>
        </mat-card>
      </div>
      
      <!-- Row 3: Heatmap (Category x Month) -->
      <div class="col-12">
        <mat-card class="glass-card">
          <div class="p-3 border-bottom">
            <h6 class="m-0 fw-bold text-muted">Spending Heatmap (Last 6 Months)</h6>
          </div>
           <div class="p-3" style="height: 350px;">
            <div echarts [options]="heatmapChart()" class="w-100 h-100"></div>
          </div>
        </mat-card>
      </div>

    </div>
  `,
  styles: [`
    ::ng-deep .custom-progress-success .mat-progress-bar-fill::after { background-color: var(--bs-success) !important; }
    ::ng-deep .custom-progress-warning .mat-progress-bar-fill::after { background-color: var(--bs-warning) !important; }
    ::ng-deep .custom-progress-danger .mat-progress-bar-fill::after { background-color: var(--bs-danger) !important; }
  `]
})
export class DashboardChartsComponent {
  private api = inject(ApiClientService);
  private catService = inject(CategoryService);
  Math = Math;

  private rollups = signal<any[]>([]);
  insights = signal<any>(null);

  // Computed chart options
  incomeExpenseChart = computed((): EChartsOption => {
    const data = this.rollups();
    // Aggregate by month
    const months = [...new Set(data.map(d => d.month))].sort();
    const income = months.map(m => data.filter(d => d.month === m).reduce((a, b) => a + Number(b.totalIncome), 0));
    const expense = months.map(m => data.filter(d => d.month === m).reduce((a, b) => a + Number(b.totalExpense), 0));

    return {
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
      xAxis: { type: 'category', data: months },
      yAxis: { type: 'value' },
      series: [
        { name: 'Income', type: 'bar', stack: 'total', data: income, itemStyle: { borderRadius: [4, 4, 0, 0], color: '#4caf50' } },
        { name: 'Expense', type: 'bar', stack: 'total', data: expense, itemStyle: { borderRadius: [4, 4, 0, 0], color: '#f44336' } }
      ]
    };
  });

  expenseDonutChart = computed((): EChartsOption => {
    // Last month only? Or aggregate of all fetched?
    // Let's do aggregate of fetched range (6 months) to show spending habits.
    const data = this.rollups();
    // Group by categoryId
    const catMap = new Map<string, number>();
    data.forEach(d => {
      const curr = catMap.get(d.categoryId) || 0;
      catMap.set(d.categoryId, curr + Number(d.totalExpense));
    });

    // Map to name
    const cats = this.catService.categories();
    const chartData = Array.from(catMap.entries()).map(([id, val]) => {
      const c = cats.find(x => x.id === id);
      return { name: c?.name || 'Unknown', value: val };
    }).sort((a, b) => b.value - a.value);

    // Top 5 + Others
    const top5 = chartData.slice(0, 5);
    const others = chartData.slice(5).reduce((acc, curr) => acc + curr.value, 0);
    if (others > 0) top5.push({ name: 'Others', value: others });

    return {
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', left: 'left', bottom: 0 },
      series: [{
        type: 'pie', radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: top5
      }]
    };
  });

  heatmapChart = computed((): EChartsOption => {
    // X: Month, Y: Category
    const data = this.rollups();
    const months = [...new Set(data.map(d => d.month))].sort();
    // Top 6 categories by total expense
    const catTotals = new Map<string, number>();
    data.forEach(d => {
      const curr = catTotals.get(d.categoryId) || 0;
      catTotals.set(d.categoryId, curr + Number(d.totalExpense));
    });
    const topCats = Array.from(catTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id]) => {
        const c = this.catService.categories().find(x => x.id === id);
        return { id, name: c?.name || 'Unknown' };
      });

    // Build Grid
    // ECharts heatmap expects [x, y, value]
    const seriesData: any[] = [];

    months.forEach((m, xIndex) => {
      topCats.forEach((cat, yIndex) => {
        const entry = data.find(d => d.month === m && d.categoryId === cat.id);
        const val = entry ? Number(entry.totalExpense) : 0;
        seriesData.push([xIndex, yIndex, val]);
      });
    });

    return {
      tooltip: { position: 'top' },
      grid: { height: '50%', top: '10%' },
      xAxis: { type: 'category', data: months, splitArea: { show: true } },
      yAxis: { type: 'category', data: topCats.map(c => c.name), splitArea: { show: true } },
      visualMap: {
        min: 0,
        max: Math.max(...seriesData.map(d => d[2])) || 1000,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '15%'
      },
      series: [{
        type: 'heatmap',
        data: seriesData,
        label: { show: false },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
      }]
    };
  });

  budgetProgress = computed(() => {
    // Current month progress
    // We need current month string. 
    // This component might need an input for "current selected month" or default to now.
    // For now, assume "current month" of the dashboard state or just Today's month.
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const data = this.rollups().filter(d => d.month === currentMonth);
    const cats = this.catService.categories();

    // Filter categories with budget > 0
    return cats.filter(c => c.budget && c.budget > 0)
      .map(c => {
        const entry = data.find(d => d.categoryId === c.id);
        const spend = entry ? Number(entry.totalExpense) : 0;
        const percent = (spend / (c.budget || 1)) * 100;
        return { name: c.name, spend, budget: c.budget, percent };
      })
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 5);
  });

  getBudgetColorClass(percent: number) {
    if (percent > 100) return 'danger';
    if (percent > 90) return 'warning';
    return 'success';
  }

  constructor() {
    // Load initial data
    this.catService.getAll().subscribe(); // Ensure categories loaded

    // Load rollups (last 6 months)
    this.api.get<any[]>('/analytics/rollups').subscribe(res => {
      // Filter raw list if needed, API returns all?
      // Let's assume API returns all for now.
      // We can sort and slice on client.
      this.rollups.set(res);
    });

    // Load Month Insights
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.api.get<any>(`/analytics/monthly?month=${currentMonth}`).subscribe(res => {
      this.insights.set(res);
    });
  }
}
