import { Component, OnInit, OnChanges, Input, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  standalone: true,
  selector: 'app-kpi-cards',
  imports: [CommonModule],
  template: `
  <div class="row g-3 mb-3">
    <div class="col-md-3" *ngIf="data() as d">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <div class="text-muted small">Average Transaction</div>
          <div class="display-6 fw-bold">{{ d.average | number:'1.0-2' }}</div>
        </div>
      </div>
    </div>
    <div class="col-md-3" *ngIf="data() as d">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <div class="text-muted small">Balance</div>
          <div class="display-6 fw-bold" [class.text-success]="d.balance>=0" [class.text-danger]="d.balance<0">
            {{ d.balance | currency:'BDT':'symbol-narrow':'1.0-0' }}
          </div>
        </div>
      </div>
    </div>
    <div class="col-md-3" *ngIf="data() as d">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <div class="text-muted small">Largest Income</div>
          <div class="fw-semibold">{{ (d.largestIncome?.amount || 0) | currency:'BDT':'symbol-narrow':'1.0-0' }}</div>
          <div class="text-muted small">{{ d.largestIncome?.date || '-' }}</div>
        </div>
      </div>
    </div>
    <div class="col-md-3" *ngIf="data() as d">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <div class="text-muted small">Largest Expense</div>
          <div class="fw-semibold">{{ (d.largestExpense?.amount || 0) | currency:'BDT':'symbol-narrow':'1.0-0' }}</div>
          <div class="text-muted small">{{ d.largestExpense?.date || '-' }}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="row g-3 mb-4">
    <div class="col-md-3" *ngIf="topCategory() as top">
      <div class="card border-0 shadow-sm h-100">
        <div class="card-body">
          <div class="text-muted small">Top Category (Expense)</div>
          <div class="fw-bold">{{ top.name }}</div>
          <div class="text-muted">{{ top.value | currency:'BDT':'symbol-narrow':'1.0-0' }}</div>
        </div>
      </div>
    </div>
    <div class="col-md-9" *ngIf="data() as d">
      <div class="card border-0 shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div class="text-muted small">Savings vs Spending (MTD)</div>
            <div class="small">Target {{ (targetRate*100) | number:'1.0-0' }}%</div>
          </div>
          <div class="position-relative">
            <div class="progress" style="height: 14px;">
              <div class="progress-bar bg-success" role="progressbar" [style.width.%]="savingsPct(d)" title="Savings"></div>
              <div class="progress-bar bg-danger" role="progressbar" [style.width.%]="spendingPct(d)" title="Spending"></div>
            </div>
            <div class="position-absolute top-0 bottom-0" [style.left.%]="targetRate*100" style="width:2px;background:#111;opacity:0.4"></div>
          </div>
          <div class="d-flex justify-content-between mt-2 small">
            <div class="text-success">Savings {{ (savingsPct(d)) | number:'1.0-0' }}%</div>
            <div class="text-danger">Spending {{ (spendingPct(d)) | number:'1.0-0' }}%</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
})
export class KpiCardsComponent implements OnInit {
  data = signal<any>(null);
  @Input() params: any = undefined;
  @Input() targetRate = 0.2; // 20% default
  constructor(private analytics: AnalyticsService) {}
  ngOnInit() { this.load(); }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['params']) this.load();
  }
  private load() {
    this.analytics.kpis(this.params).subscribe((d) => this.data.set(d));
  }

  topCategory() {
    const list: any[] = this.data()?.topExpenseCategories || [];
    return list.length ? list[0] : null;
  }

  savingsPct(d: any) {
    const inc = Number(d?.totals?.income || d?.totals?.totalIncome || 0);
    const exp = Number(d?.totals?.expense || d?.totals?.totalExpense || 0);
    if (inc <= 0) return 0;
    const pct = ((inc - exp) / inc) * 100;
    return Math.max(0, Math.min(100, pct));
  }
  spendingPct(d: any) {
    const inc = Number(d?.totals?.income || d?.totals?.totalIncome || 0);
    const exp = Number(d?.totals?.expense || d?.totals?.totalExpense || 0);
    if (inc <= 0) return 0;
    const pct = (exp / inc) * 100;
    return Math.max(0, Math.min(100, pct));
  }
}
