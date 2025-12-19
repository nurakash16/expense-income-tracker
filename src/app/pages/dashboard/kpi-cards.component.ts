import { Component, OnInit, OnChanges, Input, SimpleChanges, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  standalone: true,
  selector: 'app-kpi-cards',
  imports: [CommonModule],
  template: `
  <ng-container *ngIf="vm() as d">
    <div class="row g-3 mb-3">
      <div class="col-6 col-lg-3">
        <div class="kpi-card h-100">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="kpi-label">Total Income</div>
              <div class="kpi-value text-success">{{ d.totals.income | currency:'BDT':'symbol-narrow':'1.0-0' }}</div>
            </div>
            <div class="kpi-icon bg-success-subtle text-success">⬆</div>
          </div>
          <div class="kpi-sub">Avg tx {{ d.average | currency:'BDT':'symbol-narrow':'1.0-0' }}</div>
        </div>
      </div>

      <div class="col-6 col-lg-3">
        <div class="kpi-card h-100">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="kpi-label">Total Expense</div>
              <div class="kpi-value text-danger">{{ d.totals.expense | currency:'BDT':'symbol-narrow':'1.0-0' }}</div>
            </div>
            <div class="kpi-icon bg-danger-subtle text-danger">⬇</div>
          </div>
          <div class="kpi-sub">Top: {{ d.topCategory?.name || '—' }}</div>
        </div>
      </div>

      <div class="col-6 col-lg-3">
        <div class="kpi-card h-100">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="kpi-label">Balance</div>
              <div class="kpi-value" [class.text-success]="d.balance>=0" [class.text-danger]="d.balance<0">
                {{ d.balance | currency:'BDT':'symbol-narrow':'1.0-0' }}
              </div>
            </div>
            <div class="kpi-icon bg-primary-subtle text-primary">◎</div>
          </div>
          <div class="kpi-sub">Savings rate {{ d.savingsRate | number:'1.0-0' }}%</div>
        </div>
      </div>

      <div class="col-6 col-lg-3">
        <div class="kpi-card h-100">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="kpi-label">Largest Expense</div>
              <div class="kpi-value">{{ (d.largestExpense?.amount || 0) | currency:'BDT':'symbol-narrow':'1.0-0' }}</div>
            </div>
            <div class="kpi-icon bg-warning-subtle text-warning">!</div>
          </div>
          <div class="kpi-sub">{{ d.largestExpense?.date || '—' }}</div>
        </div>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-12 col-lg-4">
        <div class="kpi-card h-100">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="kpi-label">Top Category (Expense)</div>
              <div class="kpi-value">{{ d.topCategory?.name || '—' }}</div>
            </div>
            <div class="kpi-icon bg-info-subtle text-info">#</div>
          </div>
          <div class="kpi-sub">{{ (d.topCategory?.value || 0) | currency:'BDT':'symbol-narrow':'1.0-0' }}</div>
        </div>
      </div>

      <div class="col-12 col-lg-8">
        <div class="kpi-card h-100">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div class="kpi-label">Savings vs Spending</div>
            <div class="small text-muted">Target {{ (targetRate*100) | number:'1.0-0' }}%</div>
          </div>
          <div class="position-relative">
            <div class="progress" style="height: 14px; border-radius: 999px; overflow: hidden;">
              <div class="progress-bar bg-success" role="progressbar" [style.width.%]="savingsPct(d)" title="Savings"></div>
              <div class="progress-bar bg-danger" role="progressbar" [style.width.%]="spendingPct(d)" title="Spending"></div>
            </div>
          <div class="position-absolute top-0 bottom-0 target-line" [style.left.%]="targetRate*100"></div>
          </div>
          <div class="d-flex justify-content-between mt-2 small">
            <div class="text-success">Savings {{ (savingsPct(d)) | number:'1.0-0' }}%</div>
            <div class="text-danger">Spending {{ (spendingPct(d)) | number:'1.0-0' }}%</div>
          </div>
        </div>
      </div>
    </div>
  </ng-container>
  `,
  styles: [`
    :host{
      --kpi-surface: rgba(255,255,255,0.85);
      --kpi-border: rgba(255,255,255,0.55);
      --kpi-shadow: 0 10px 30px rgba(0,0,0,.06);
      --kpi-text: rgba(0,0,0,.55);
      --kpi-line: rgba(17,24,39,.45);
    }
    :host-context([data-bs-theme="dark"]){
      --kpi-surface: rgba(15,23,42,0.8);
      --kpi-border: rgba(148,163,184,0.2);
      --kpi-shadow: 0 10px 30px rgba(0,0,0,.45);
      --kpi-text: rgba(148,163,184,.85);
      --kpi-line: rgba(226,232,240,.5);
    }
    .kpi-card{
      background: var(--kpi-surface);
      border: 1px solid var(--kpi-border);
      border-radius: 14px;
      box-shadow: var(--kpi-shadow);
      padding: 14px;
      backdrop-filter: blur(10px);
    }
    .kpi-label{ font-size: 12px; color: var(--kpi-text); font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
    .kpi-value{ font-size: clamp(18px, 3.2vw, 28px); font-weight: 800; line-height: 1.15; margin-top: 6px; }
    .kpi-sub{ margin-top: 10px; font-size: 12px; color: var(--kpi-text); }
    .kpi-icon{ width: 34px; height: 34px; border-radius: 12px; display:flex; align-items:center; justify-content:center; font-weight:900; }
    .target-line{
      width: 2px;
      background: var(--kpi-line);
      opacity: 0.35;
    }
  `]
})
export class KpiCardsComponent implements OnInit {
  /**
   * If you already fetched stats in the parent, pass them here to avoid extra API calls.
   * Expected shape: same as GET /api/kpi.
   */
  @Input() stats: any = null;

  data = signal<any>(null);
  /** Optional params for GET /api/kpi (start/end/type/categoryId/paymentMethod). */
  @Input() params: any = undefined;
  @Input() targetRate = 0.2; // 20% default
  constructor(private analytics: AnalyticsService) {}
  ngOnInit() { this.load(); }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['stats'] || changes['params']) this.load();
  }
  private load() {
    if (this.stats) {
      this.data.set(this.stats);
      return;
    }
    this.analytics.kpis(this.params).subscribe((d) => this.data.set(d));
  }

  vm = computed(() => {
    const d = this.data();
    if (!d) return null;
    const list: any[] = d.topExpenseCategories || [];
    const inc = Number(d?.totals?.income || 0);
    const exp = Number(d?.totals?.expense || 0);
    const balance = Number(d?.balance ?? (inc - exp));
    const savingsRate = inc > 0 ? ((inc - exp) / inc) * 100 : 0;
    return {
      ...d,
      totals: { income: inc, expense: exp },
      balance,
      savingsRate: Math.max(0, Math.min(100, savingsRate)),
      topCategory: list.length ? list[0] : null,
    };
  });

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
