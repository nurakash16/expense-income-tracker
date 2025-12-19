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
<section class=\"ins-shell\">
  <section class=\"ins-hero glass\">
    <div class=\"hero-left\">
      <div class=\"chip\">EXECUTIVE INSIGHTS</div>
      <h1>Insights <span class=\"grad\">Cockpit</span></h1>
      <p class=\"sub\">Analyze your spending patterns.</p>
    </div>
    <div class=\"hero-right\">
      <label class=\"month\">
        <span>Month</span>
        <input type=\"month\" [ngModel]=\"month()\" (ngModelChange)=\"month.set($event); onMonthChange()\">
      </label>
    </div>
  </section>

  <div *ngIf=\"isLoading()\" class=\"state\">
    <div class=\"spinner\"></div>
    <div>Loading insights...</div>
  </div>

  <section class=\"kpi-grid\" *ngIf=\"!isLoading() && data()\">
    <div class=\"kpi-card glass\">
      <div class=\"kpi-label\">Total Spent</div>
      <div class=\"kpi-value danger\">{{ data().current.expense | currency }}</div>
      <div class=\"kpi-sub\">vs last month {{ data().delta.expense | currency }}</div>
    </div>
    <div class=\"kpi-card glass\">
      <div class=\"kpi-label\">Total Income</div>
      <div class=\"kpi-value success\">{{ data().current.income | currency }}</div>
      <div class=\"kpi-sub\">vs last month {{ data().delta.income | currency }}</div>
    </div>
    <div class=\"kpi-card glass\">
      <div class=\"kpi-label\">Net</div>
      <div class=\"kpi-value\" [class.success]=\"(data().current.income - data().current.expense) >= 0\" [class.danger]=\"(data().current.income - data().current.expense) < 0\">
        {{ (data().current.income - data().current.expense) | currency }}
      </div>
      <div class=\"kpi-sub\">Income minus expense</div>
    </div>
  </section>

  <section class=\"grid\" *ngIf=\"!isLoading() && data()\">
    <div class=\"glass card\">
      <div class=\"card-head\">
        <div>
          <div class=\"card-title\">Expense Breakdown</div>
          <div class=\"card-sub\">Top categories</div>
        </div>
      </div>
      <div class=\"chart\">
        <div echarts [options]=\"chartOption()\" class=\"ech\"></div>
      </div>
    </div>

    <div class=\"glass card\">
      <div class=\"card-head\">
        <div>
          <div class=\"card-title\">Unusual Spending</div>
          <div class=\"card-sub\">Watch for spikes</div>
        </div>
      </div>
      <div class=\"list\" *ngIf=\"hasUnusual(); else noUnusual\">
        <ng-container *ngFor=\"let item of data().categoryDetails\">
          <div class=\"list-row\" *ngIf=\"item.isUnusual\">
            <div class=\"row-title\">{{ getCategoryName(item.categoryId) }}</div>
            <div class=\"row-sub\">Usual: ~{{ item.previous | currency }}</div>
            <div class=\"row-value danger\">{{ item.current | currency }}</div>
          </div>
        </ng-container>
      </div>
      <ng-template #noUnusual>
        <div class=\"empty\">No unusual spending detected.</div>
      </ng-template>
    </div>

    <div class=\"glass card full\">
      <div class=\"card-head\">
        <div>
          <div class=\"card-title\">Detailed Breakdown</div>
          <div class=\"card-sub\">Top 5 categories</div>
        </div>
      </div>
      <div class=\"table-wrap\">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th class=\"right\">Spent</th>
              <th class=\"right\">Change</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor=\"let item of data().categoryDetails.slice(0,5)\">
              <td>{{ getCategoryName(item.categoryId) }}</td>
              <td class=\"right\">{{ item.current | currency }}</td>
              <td class=\"right\">
                <span [class.danger]=\"item.diff > 0\" [class.success]=\"item.diff < 0\">{{ item.diff | currency }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</section>
`,
    styles: [`

:host{
  --ins-ink: #0f172a;
  --ins-muted: #64748b;
  --ins-surface: rgba(255,255,255,0.82);
  --ins-border: rgba(15,23,42,0.08);
  --ins-soft: rgba(15,23,42,0.08);
  --ins-shadow: 0 16px 40px rgba(15,23,42,0.1);
  display:block;
  color: var(--ins-ink);
}
:host-context([data-bs-theme="dark"]){
  --ins-ink: #e5e7eb;
  --ins-muted: #94a3b8;
  --ins-surface: rgba(15,23,42,0.88);
  --ins-border: rgba(148,163,184,0.2);
  --ins-soft: rgba(148,163,184,0.12);
  --ins-shadow: 0 16px 40px rgba(0,0,0,0.45);
}
.ins-shell{
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
}
.glass{
  background: var(--ins-surface);
  border: 1px solid var(--ins-border);
  border-radius: 18px;
  box-shadow: var(--ins-shadow);
  backdrop-filter: blur(14px);
}
.ins-hero{
  padding: 16px;
  margin-bottom: 16px;
}
.hero-left h1{
  margin: 8px 0 6px;
  font-size: clamp(22px, 4vw, 34px);
  font-weight: 900;
}
.grad{
  background: linear-gradient(135deg, #6366f1, #22c55e, #ec4899);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.sub{ color: var(--ins-muted); font-weight: 700; }
.chip{
  display:inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--ins-soft);
  border: 1px solid var(--ins-border);
  font-size: 12px;
  letter-spacing: 0.1em;
  font-weight: 800;
  color: var(--ins-muted);
}
.hero-row{ display:flex; align-items:center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.month{ display:flex; flex-direction: column; gap: 6px; font-weight: 800; color: var(--ins-muted); }
.month input{ padding: 8px 10px; border-radius: 12px; border: 1px solid var(--ins-border); background: rgba(255,255,255,0.9); font-weight: 800; }
:host-context([data-bs-theme="dark"]) .month input{ background: rgba(15,23,42,0.8); color: var(--ins-ink); }
.meta{ display:flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
.meta-item{ padding: 8px 10px; border-radius: 12px; background: var(--ins-soft); border: 1px solid var(--ins-border); }
.label{ font-size: 12px; font-weight: 800; color: var(--ins-muted); }
.value{ font-weight: 900; }
.state{ display:flex; gap: 10px; align-items:center; padding: 14px; border-radius: 14px; background: var(--ins-soft); border: 1px dashed var(--ins-border); }
.spinner{ width: 18px; height: 18px; border: 3px solid rgba(148,163,184,0.3); border-top-color: var(--ins-ink); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin{ to{ transform: rotate(360deg); } }
.kpi-grid{ display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 12px; margin-bottom: 12px; }
.kpi-card{ padding: 12px; }
.kpi-label{ font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ins-muted); }
.kpi-value{ margin-top: 6px; font-size: 20px; font-weight: 900; }
.kpi-sub{ margin-top: 4px; color: var(--ins-muted); font-weight: 700; font-size: 12px; }
.kpi-value.success{ color: #16a34a; }
.kpi-value.danger{ color: #dc2626; }
.grid{ display:grid; grid-template-columns: repeat(auto-fit, minmax(280px,1fr)); gap: 12px; }
.card{ padding: 14px; }
.card-head{ display:flex; align-items:flex-start; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
.card-title{ font-weight: 900; }
.card-sub{ color: var(--ins-muted); font-weight: 700; font-size: 12px; }
.chart{ min-height: 320px; }
.ech{ width: 100%; height: 100%; min-height: 320px; }
.list{ display:flex; flex-direction: column; gap: 10px; }
.list-row{ padding: 10px; border-radius: 12px; background: var(--ins-soft); border: 1px solid var(--ins-border); }
.row-title{ font-weight: 900; }
.row-sub{ color: var(--ins-muted); font-weight: 700; font-size: 12px; }
.row-value{ font-weight: 900; margin-top: 6px; }
.row-value.danger{ color: #dc2626; }
.empty{ padding: 12px; border-radius: 12px; background: var(--ins-soft); border: 1px dashed var(--ins-border); color: var(--ins-muted); }
.table-wrap{ overflow-x: auto; }
.table-wrap table{ width: 100%; border-collapse: collapse; }
.table-wrap th, .table-wrap td{ padding: 10px; border-bottom: 1px solid var(--ins-border); }
.table-wrap th{ font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ins-muted); text-align: left; }
.table-wrap .right{ text-align: right; }
.danger{ color: #dc2626; font-weight: 900; }
.success{ color: #16a34a; font-weight: 900; }
.full{ grid-column: 1 / -1; }
@media (max-width: 768px){
  .kpi-grid{ grid-template-columns: 1fr; }
}
@media (max-width: 600px){
  .ins-shell{ padding: 12px; padding-bottom: 140px; }
  .month input{ width: 100%; }
  .chart{ min-height: 360px; }
  .ech{ min-height: 360px; }
}
`]
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

    monthLabel(): string {
        const current = this.month();
        if (!current) return '';
        const date = new Date(current + '-01');
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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
