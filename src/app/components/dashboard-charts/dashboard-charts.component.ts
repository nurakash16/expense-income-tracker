import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { ApiClientService } from '../../services/api-client.service';
import { CategoryService } from '../../services/category.service';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from '../../services/theme.service';

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
          <div class="p-3 chart-box">
            <div echarts [options]="incomeExpenseChart()" [autoResize]="true" class="w-100 h-100"></div>
          </div>
        </mat-card>
      </div>

      <!-- Row 1: Expense Breakdown (Donut) -->
      <div class="col-12 col-lg-5">
        <mat-card class="glass-card h-100">
          <div class="p-3 border-bottom">
            <h6 class="m-0 fw-bold text-muted">Expense Breakdown (Top Categories)</h6>
          </div>
          <div class="p-3 chart-box">
            <div echarts [options]="expenseDonutChart()" [autoResize]="true" class="w-100 h-100"></div>
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
             <div *ngIf="insights()?.categoryDetails?.length === 0" class="text-center text-muted py-4">
               No significant changes.
             </div>
             <div *ngFor="let item of insights()?.categoryDetails | slice:0:3" class="mb-3">
               <div class="d-flex justify-content-between align-items-center mb-1">
                 <span class="fw-medium">{{ getCategoryName($any(item).categoryId) }}</span>
                 <span [class.text-danger]="$any(item).diff > 0" [class.text-success]="$any(item).diff < 0">
                   {{ $any(item).diff > 0 ? '+' : '' }}{{ $any(item).diff | currency:'BDT' }}
                   <small class="opacity-75">({{ $any(item).pct | number:'1.0-0' }}%)</small>
                 </span>
               </div>
               <mat-progress-bar mode="determinate" [value]="Math.abs($any(item).pct)"
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
            <div *ngIf="!hasAlerts()" class="text-center text-muted py-4">
              <mat-icon class="fs-1 opacity-25">check_circle</mat-icon>
              <p>Everything looks normal.</p>
            </div>
            <div *ngFor="let alert of alerts()" class="alert alert-light border-start border-4 border-warning d-flex gap-3 align-items-center mb-2 p-2">
               <mat-icon class="text-warning">notifications_active</mat-icon>
               <div class="lh-sm">
                 <div class="fw-bold">{{ getCategoryName(alert.categoryId) }}</div>
                 <small class="text-muted">Higher than usual (>30% spike).</small>
               </div>
            </div>
          </div>
        </mat-card>
      </div>

      <!-- Row 3: Cash Flow Waterfall -->
      <div class="col-12">
        <mat-card class="glass-card">
           <div class="p-3 border-bottom">
            <h6 class="m-0 fw-bold text-muted">Net Cash Flow (Waterfall)</h6>
          </div>
          <div class="p-3 chart-box">
            <div echarts [options]="waterfallChart()" [autoResize]="true" class="w-100 h-100"></div>
          </div>
        </mat-card>
      </div>

      <!-- Row 4: Budget Progress -->
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

      <!-- Row 5: Heatmap (Category x Month) -->
      <div class="col-12">
        <mat-card class="glass-card">
          <div class="p-3 border-bottom">
            <h6 class="m-0 fw-bold text-muted">Spending Heatmap (Last 6 Months)</h6>
          </div>
           <div class="p-3 chart-box chart-box-tall">
            <div echarts [options]="heatmapChart()" [autoResize]="true" class="w-100 h-100"></div>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    ::ng-deep .custom-progress-success .mat-progress-bar-fill::after { background-color: var(--bs-success) !important; }
    ::ng-deep .custom-progress-warning .mat-progress-bar-fill::after { background-color: var(--bs-warning) !important; }
    ::ng-deep .custom-progress-danger .mat-progress-bar-fill::after { background-color: var(--bs-danger) !important; }

    .chart-box{ height: clamp(220px, 35vh, 340px); }
    .chart-box-tall{ height: clamp(280px, 45vh, 420px); }
  `]
})
export class DashboardChartsComponent {
  private api = inject(ApiClientService);
  private catService = inject(CategoryService);
  private themeService = inject(ThemeService);
  Math = Math;

  private rollups = signal<any[]>([]);
  insights = signal<any>(null);

  // Waterfall Data (Net Cash Flow)
  waterfallData = signal<any>(null);

  // Helper
  getCategoryName(id: string) {
    return this.catService.categories().find(c => c.id === id)?.name || 'Unknown';
  }

  hasAlerts() {
    return this.insights()?.categoryDetails?.some((x: any) => x.isUnusual);
  }

  alerts() {
    return this.insights()?.categoryDetails?.filter((x: any) => x.isUnusual) || [];
  }

  // Computed chart options
  incomeExpenseChart = computed((): EChartsOption => {
    const isDark = this.themeService.theme() === 'dark';
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const gridLine = isDark ? 'rgba(148,163,184,0.2)' : 'rgba(148,163,184,0.35)';
    const data = this.rollups();
    const months = [...new Set(data.map(d => d.month))].sort();

    const wf = this.waterfallData();
    if (!wf) return {};

    return {
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0, textStyle: { color: textColor } },
      grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
      xAxis: { type: 'category', data: wf.months, axisLabel: { color: textColor } },
      yAxis: { type: 'value', axisLabel: { color: textColor }, splitLine: { lineStyle: { color: gridLine } } },
      series: [
        { name: 'Income', type: 'bar', data: wf.income, itemStyle: { borderRadius: [4, 4, 0, 0], color: '#4caf50' } },
        { name: 'Expense', type: 'bar', data: wf.expense, itemStyle: { borderRadius: [4, 4, 0, 0], color: '#f44336' } }
      ],
      media: [
        {
          query: { maxWidth: 520 },
          option: {
            grid: { left: '6%', right: '4%', bottom: '12%', containLabel: true },
            legend: { top: 0, bottom: null }
          }
        }
      ]
    };
  });

  waterfallChart = computed((): EChartsOption => {
    const isDark = this.themeService.theme() === 'dark';
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const gridLine = isDark ? 'rgba(148,163,184,0.2)' : 'rgba(148,163,184,0.35)';
    const wf = this.waterfallData();
    if (!wf) return {};

    const net = wf.net.map((n: number) => ({
      value: n,
      itemStyle: { color: n >= 0 ? '#2196f3' : '#ff9800' }
    }));

    return {
      title: { subtext: 'Net Savings per Month', left: 'center', textStyle: { color: textColor }, subtextStyle: { color: textColor } },
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
      xAxis: { type: 'category', data: wf.months, axisLabel: { color: textColor } },
      yAxis: { type: 'value', axisLabel: { color: textColor }, splitLine: { lineStyle: { color: gridLine } } },
      series: [
        {
          type: 'bar',
          data: net,
          label: { show: true, position: 'top', color: textColor }
        }
      ]
    };
  });

  expenseDonutChart = computed((): EChartsOption => {
    const isDark = this.themeService.theme() === 'dark';
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const borderColor = isDark ? '#0f172a' : '#fff';
    const details = this.insights()?.categoryDetails || [];
    const top5 = details.slice(0, 5).map((d: any) => ({
      name: this.getCategoryName(d.categoryId),
      value: Number(d.current)
    }));

    return {
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', left: 'left', bottom: 0, textStyle: { color: textColor } },
      series: [{
        type: 'pie', radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor, borderWidth: 2 },
        label: { show: false },
        data: top5
      }],
      media: [
        {
          query: { maxWidth: 520 },
          option: {
            legend: { orient: 'horizontal', left: 'center', bottom: 0 }
          }
        }
      ]
    };
  });

  heatmapChart = computed((): EChartsOption => {
    const isDark = this.themeService.theme() === 'dark';
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const mutedText = isDark ? '#94a3b8' : '#6b7280';
    const borderColor = isDark ? 'rgba(148,163,184,0.22)' : '#d1d5db';
    const lineColor = isDark ? 'rgba(148,163,184,0.25)' : '#e5e7eb';
    const raw = this.heatmapData();
    if (!raw) return {};
    const filteredData = (raw.data || []).filter((d: any) => Number(d?.[1] || 0) > 0);
    const maxValue = 10000;

    return {
      backgroundColor: isDark ? '#0f172a' : 'transparent',
      tooltip: {
        position: 'top',
        formatter: (p: any) => `${p.data[0]}: ${p.data[1] || 0}`
      },
      visualMap: {
        min: 0,
        max: Math.max(1, maxValue),
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        top: 10,
        itemWidth: 14,
        itemHeight: 140,
        textStyle: { fontWeight: 700, color: textColor },
        inRange: {
          color: isDark
            ? ['#1f2937', '#f97316', '#fbbf24']
            : ['#fff7ed', '#fb923c', '#7c2d12']
        }
      },
      calendar: {
        top: 190,
        left: 10,
        right: 10,
        cellSize: ['auto', 22],
        range: raw.year,
        itemStyle: {
          borderWidth: 1,
          borderColor,
          color: isDark ? '#111827' : '#ffffff'
        },
        dayLabel: { color: mutedText, fontSize: 10 },
        monthLabel: { color: textColor, fontWeight: 700, fontSize: 12 },
        splitLine: { show: true, lineStyle: { color: lineColor } },
        yearLabel: { show: false }
      },
      series: {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: filteredData,
        label: {
          show: true,
          formatter: (p: any) => (p.data?.[0] || '').slice(-2),
          color: isDark ? '#f8fafc' : '#0f172a',
          fontSize: 10,
          textBorderColor: isDark ? 'rgba(15,23,42,0.75)' : 'rgba(255,255,255,0.85)',
          textBorderWidth: 2
        }
      }
    };
  });

  heatmapData = signal<any>(null);

  budgetProgress = computed(() => {
    const details = this.insights()?.categoryDetails || [];
    const cats = this.catService.categories();

    return cats.filter(c => c.budget && c.budget > 0).map(c => {
      const actual = details.find((d: any) => d.categoryId === c.id);
      const spend = actual ? Number(actual.current) : 0;
      const percent = (spend / (c.budget || 1)) * 100;
      return { name: c.name, spend, budget: c.budget, percent };
    }).sort((a, b) => b.percent - a.percent).slice(0, 5);
  });

  getBudgetColorClass(percent: number) {
    if (percent > 100) return 'danger';
    if (percent > 90) return 'warning';
    return 'success';
  }

  constructor() {
    this.catService.getAll().subscribe(); // Ensure categories loaded

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    // 1. Insights & Donut Data (Current Month)
    this.api.get<any>(`/analytics/monthly?month=${currentMonth}`).subscribe(res => {
      this.insights.set(res);
    });

    // 2. Waterfall & Stacked Bar Data (Six Months)
    this.api.get<any>('/analytics/waterfall').subscribe(res => {
      this.waterfallData.set(res);
    });

    // 3. Heatmap Data (Yearly Daily Intensity)
    this.api.get<any>(`/analytics/heatmap?year=${now.getFullYear()}`).subscribe(res => {
      this.heatmapData.set(res);
    });
  }
}
