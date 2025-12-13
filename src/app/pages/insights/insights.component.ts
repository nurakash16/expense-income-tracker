import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiClientService } from '../../services/api-client.service';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/category.model';
import { NgxEchartsModule } from 'ngx-echarts';
import { ThemeService } from '../../services/theme.service';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule, NgxEchartsModule],
    template: `
<div class="mb-4 d-flex align-items-center justify-content-between">
    <div>
        <h2 class="fw-bold mb-1 text-dark">Insights</h2>
        <div class="text-muted">Analyze your spending patterns.</div>
    </div>
    <div>
        <input type="month" class="form-control" [ngModel]="month()"
            (ngModelChange)="month.set($event); onMonthChange()">
    </div>
</div>

<div *ngIf="isLoading()" class="text-center py-5">
    <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
    </div>
</div>

<div *ngIf="!isLoading() && data()" class="row g-4">
    <!-- Chart Section -->
    <div class="col-12">
        <div class="card border-0 shadow-sm">
            <div class="card-body" style="min-height: 300px;">
                <div echarts [options]="chartOption()" class="demo-chart" style="height: 300px;"></div>
            </div>
        </div>
    </div>

    <!-- Summary Cards -->
    <div class="col-md-6 col-lg-4">
        <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
                <h6 class="text-muted text-uppercase small fw-bold mb-3">Total Spent</h6>
                <div class="d-flex align-items-baseline gap-2">
                    <h3 class="mb-0 fw-bold text-dark">{{ data().current.expense | currency }}</h3>
                    <span class="badge rounded-pill" [class.bg-danger-subtle]="data().delta.expense > 0"
                        [class.text-danger-emphasis]="data().delta.expense > 0"
                        [class.bg-success-subtle]="data().delta.expense <= 0"
                        [class.text-success-emphasis]="data().delta.expense <= 0">
                        {{ data().delta.expense > 0 ? '+' : '' }}{{ data().delta.expense | currency }}
                    </span>
                </div>
                <div class="small text-muted mt-2">vs last month</div>
            </div>
        </div>
    </div>

    <div class="col-md-6 col-lg-4">
        <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
                <h6 class="text-muted text-uppercase small fw-bold mb-3">Total Income</h6>
                <div class="d-flex align-items-baseline gap-2">
                    <h3 class="mb-0 fw-bold text-dark">{{ data().current.income | currency }}</h3>
                    <span class="badge rounded-pill" [class.bg-success-subtle]="data().delta.income > 0"
                        [class.text-success-emphasis]="data().delta.income > 0"
                        [class.bg-secondary-subtle]="data().delta.income <= 0"
                        [class.text-secondary-emphasis]="data().delta.income <= 0">
                        {{ data().delta.income > 0 ? '+' : '' }}{{ data().delta.income | currency }}
                    </span>
                </div>
                <div class="small text-muted mt-2">vs last month</div>
            </div>
        </div>
    </div>
</div>

<div *ngIf="!isLoading() && data()" class="row g-4 mt-2">
    <!-- Unusual Spending Alert -->
    <div class="col-lg-6">
        <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-bottom py-3">
                <h6 class="m-0 fw-bold text-dark">⚠️ Unusual Spending</h6>
            </div>
            <div class="card-body p-0">
                <ul class="list-group list-group-flush">
                    <ng-container *ngFor="let item of data().categoryDetails">
                        <li *ngIf="item.isUnusual" class="list-group-item p-3 border-bottom-0">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <div class="fw-bold text-dark">{{ getCategoryName(item.categoryId) }}</div>
                                    <div class="small text-muted">
                                        Usual: ~{{ item.previous | currency }}
                                    </div>
                                </div>
                                <div class="text-end">
                                    <div class="fw-bold text-danger">{{ item.current | currency }}</div>
                                    <span class="badge bg-danger-subtle text-danger-emphasis rounded-pill">
                                        +{{ item.pct | number:'1.0-1' }}%
                                    </span>
                                </div>
                            </div>
                        </li>
                    </ng-container>
                    <div *ngIf="!hasUnusual()"
                        class="p-4 text-center text-muted">
                        <span class="fs-4 d-block mb-2">✅</span>
                        No unusual spending detected this month.
                    </div>
                </ul>
            </div>
        </div>
    </div>

    <!-- Top Movers -->
    <div class="col-lg-6">
        <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-bottom py-3">
                <h6 class="m-0 fw-bold text-dark">Detailed Breakdown</h6>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table align-middle mb-0">
                        <thead class="bg-light">
                            <tr>
                                <th class="ps-3 border-0">Category</th>
                                <th class="text-end border-0">Spent</th>
                                <th class="text-end pe-3 border-0">Change</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr *ngFor="let item of data().categoryDetails.slice(0, 5)">
                                <td class="ps-3 fw-semibold text-dark">{{ getCategoryName(item.categoryId) }}</td>
                                <td class="text-end">{{ item.current | currency }}</td>
                                <td class="text-end pe-3">
                                    <span class="badge rounded-pill" [class.bg-danger-subtle]="item.diff > 0"
                                        [class.text-danger-emphasis]="item.diff > 0"
                                        [class.bg-success-subtle]="item.diff < 0"
                                        [class.text-success-emphasis]="item.diff < 0">
                                        {{ item.diff > 0 ? '+' : '' }}{{ item.diff | currency }}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>
    `,
})
export class InsightsComponent implements OnInit {
    private api = inject(ApiClientService);
    private catService = inject(CategoryService);
    private themeService = inject(ThemeService);

    month = signal<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
    isLoading = signal<boolean>(false);

    data = signal<any>(null);
    categories = this.catService.categories;

    chartOption = signal<any>({});

    constructor() {
        this.catService.getAll().subscribe();

        // React to theme changes to update chart text color
        effect(() => {
            const t = this.themeService.theme();
            this.updateChartOption();
        });
    }

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);
        const monthParam = `${this.month()}-01`;
        this.api.get<any>('/analytics/monthly', { params: { month: monthParam } }).subscribe({
            next: (res) => {
                this.data.set(res);
                this.updateChartOption();
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }

    updateChartOption() {
        const d = this.data();
        if (!d) return;

        const isDark = this.themeService.theme() === 'dark';
        const textColor = isDark ? '#e5e7eb' : '#374151';

        const chartData = d.categoryDetails
            .filter((c: any) => c.current > 0)
            .map((c: any) => ({
                name: this.getCategoryName(c.categoryId),
                value: c.current
            }));

        this.chartOption.set({
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c} ({d}%)'
            },
            legend: {
                bottom: '0%',
                left: 'center',
                textStyle: { color: textColor }
            },
            series: [
                {
                    name: 'Expense',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 10,
                        borderColor: isDark ? '#1f2937' : '#fff',
                        borderWidth: 2
                    },
                    label: {
                        show: false,
                        position: 'center'
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: 20,
                            fontWeight: 'bold',
                            color: textColor
                        }
                    },
                    labelLine: {
                        show: false
                    },
                    data: chartData
                }
            ]
        });
    }

    onMonthChange() {
        this.loadData();
    }

    getCategoryName(id: string): string {
        const found = this.categories().find(c => c.id === id);
        return found ? found.name : 'Unknown';
    }

    hasUnusual(): boolean {
        const d = this.data();
        if (!d || !d.categoryDetails) return false;
        return d.categoryDetails.some((x: any) => x.isUnusual);
    }
}
