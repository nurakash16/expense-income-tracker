import { Component, Input, OnChanges, SimpleChanges, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { SalaryService } from '../../services/salary.service';
import { ApiClientService } from '../../services/api-client.service';
import { DashboardDataService } from '../../services/dashboard-data.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-monthly-summary',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatMenuModule, FormsModule],
  template: `
    <div class="ms-card">
      <div class="ms-grid">
        <div class="stat base">
          <div class="stat-head">
          <div class="label">Base Salary</div>
          <button class="ms-action" type="button" (click)="toggleEdit()">{{ editingSalary() ? 'Cancel' : 'Edit salary' }}</button>
        </div>
          <div class="value primary">
            {{ salaryService.currentSalary() | currency:'BDT' }}
            <mat-icon *ngIf="isInherited()" class="tiny-icon text-muted" title="Carried forward">history</mat-icon>
          </div>
          <div class="edit" *ngIf="editingSalary()">
            <input type="number" class="form-control form-control-sm" [(ngModel)]="editAmount" placeholder="Amount">
            <button type="button" class="ms-save" (click)="saveSalary()">Save</button>
          </div>
        </div>

        <div class="stat income">
          <div class="label">Total Income</div>
          <div class="value success">{{ monthlyIncome() | currency:'BDT' }}</div>
          <div class="muted">+{{ otherIncome() | currency:'BDT' }} extra</div>
        </div>

        <div class="stat expense">
          <div class="label">Total Expense</div>
          <div class="value danger">{{ monthlyExpense() | currency:'BDT' }}</div>
          <div class="muted">Spending this month</div>
        </div>

        <div class="stat net">
          <div class="label">Net Savings</div>
          <div class="value bold" [class.success]="savings() >= 0" [class.danger]="savings() < 0">
            {{ savings() | currency:'BDT' }}
          </div>
          <div class="muted">Cumulative (tx-only): {{ cumulativeSavings() | currency:'BDT' }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host{
      --ms-surface: rgba(255,255,255,0.9);
      --ms-border: rgba(0,0,0,0.06);
      --ms-text: #111827;
      --ms-muted: rgba(0,0,0,.55);
      --ms-stat: rgba(248,249,253,0.8);
      --ms-base: linear-gradient(135deg, #eef2ff, #f8fafc);
      --ms-income: linear-gradient(135deg, #ecfdf3, #f8fafc);
      --ms-expense: linear-gradient(135deg, #fef2f2, #f8fafc);
      --ms-net: linear-gradient(135deg, #f0f9ff, #f8fafc);
      --ms-shadow: 0 14px 40px rgba(0,0,0,0.08);
    }
    :host-context([data-bs-theme="dark"]){
      --ms-surface: rgba(15,23,42,0.85);
      --ms-border: rgba(148,163,184,0.2);
      --ms-text: #e5e7eb;
      --ms-muted: rgba(148,163,184,.85);
      --ms-stat: rgba(15,23,42,0.7);
      --ms-base: linear-gradient(135deg, rgba(59,130,246,0.18), rgba(15,23,42,0.9));
      --ms-income: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(15,23,42,0.9));
      --ms-expense: linear-gradient(135deg, rgba(248,113,113,0.2), rgba(15,23,42,0.9));
      --ms-net: linear-gradient(135deg, rgba(56,189,248,0.2), rgba(15,23,42,0.9));
      --ms-shadow: 0 14px 40px rgba(0,0,0,0.45);
    }
    .ms-card{
      padding: 0;
      border-radius: 0;
      box-shadow: none;
      background: transparent;
      border: none;
    }
    .eyebrow{ font-size:12px; font-weight:800; letter-spacing:.08em; color:var(--ms-muted); text-transform:uppercase; }
    .title{ font-weight:900; color:var(--ms-text); }
    .ms-action{
      border: 1px solid var(--ms-border);
      background: transparent;
      color: var(--ms-text);
      padding: 6px 10px;
      border-radius: 10px;
      font-weight: 800;
      font-size: 12px;
      cursor: pointer;
    }
    .ms-action:hover{
      background: var(--ms-stat);
    }
    .ms-grid{ display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:12px; margin-top:0; }
    .stat{ padding:12px; border-radius:14px; background:var(--ms-stat); border:1px solid var(--ms-border); min-height:120px; position:relative; }
    .stat-head{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
    .stat.base{ background:var(--ms-base); }
    .stat.income{ background:var(--ms-income); }
    .stat.expense{ background:var(--ms-expense); }
    .stat.net{ background:var(--ms-net); }
    .label{ font-size:12px; font-weight:800; color:var(--ms-muted); text-transform:uppercase; letter-spacing:.04em; }
    .value{ font-weight:900; font-size:22px; margin-top:6px; }
    .value.success{ color:#16a34a; }
    .value.danger{ color:#dc2626; }
    .value.primary{ color:#2563eb; }
    .value.bold{ font-size:24px; }
    .muted{ margin-top:6px; color:var(--ms-muted); font-weight:700; font-size:12px; }
    .edit input{ font-weight:700; }
    .ms-save{
      width: 100%;
      border: none;
      margin-top: 8px;
      padding: 8px 10px;
      border-radius: 10px;
      font-weight: 800;
      color: #fff;
      background: linear-gradient(135deg, #2563eb, #22c55e);
      cursor: pointer;
    }
    .tiny-icon { font-size: 14px; width: 14px; height: 14px; vertical-align: middle; }
    @media (max-width: 640px){ .ms-grid{ grid-template-columns: 1fr; } }
  `]
})
export class MonthlySummaryComponent implements OnChanges, OnInit {
  @Input() month: string = ''; // YYYY-MM

  salaryService = inject(SalaryService);
  private api = inject(ApiClientService);
  private dashData = inject(DashboardDataService);

  editingSalary = signal(false);
  editAmount = 0;
  isInherited = signal(false);

  selectedMonth = signal<string>(new Date().toISOString().slice(0, 7));

  // Data Signals
  /** Monthly totals from GET /api/analytics/monthly (current month aggregate) */
  private monthlyTotals = signal<{ income: number; expense: number } | null>(null);
  /** Waterfall series (last N months, transaction-only) */
  private waterfall = signal<{ months: string[]; income: number[]; expense: number[]; net: number[] } | null>(null);

  // Computed Properties derived from API + Salary
  // API returns transaction income; we add salary on top in the UI.
  otherIncome = computed(() => Number(this.monthlyTotals()?.income || 0));
  monthlyIncome = computed(() => (this.salaryService.currentSalary() || 0) + this.otherIncome());
  monthlyExpense = computed(() => Number(this.monthlyTotals()?.expense || 0));

  savings = computed(() => this.monthlyIncome() - this.monthlyExpense());

  cumulativeSavings = computed(() => {
    // Transaction-only cumulative (salary history isn't available as a list endpoint)
    const wf = this.waterfall();
    if (!wf) return 0;
    const current = this.selectedMonth();
    let acc = 0;
    for (let i = 0; i < wf.months.length; i++) {
      if (wf.months[i] <= current) acc += Number(wf.net[i] || 0);
    }
    return acc;
  });

  monthLabel = computed(() => {
    if (!this.selectedMonth()) return '';
    const date = new Date(this.selectedMonth() + '-01');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  constructor() {
    // Preload a reasonable range for cumulative (last 12 months including current)
    const now = new Date();
    const end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const start = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
    this.api.get<any>('/analytics/waterfall', { params: { start, end } }).subscribe(res => this.waterfall.set(res));
  }

  ngOnInit() {
    const initial = this.month || this.selectedMonth();
    const normalized = initial ? initial : new Date().toISOString().slice(0, 7);
    this.selectedMonth.set(normalized);
    this.loadData(normalized);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['month'] && changes['month'].currentValue) {
      this.selectedMonth.set(changes['month'].currentValue);
      this.loadData(this.selectedMonth());
    }
  }

  loadData(month: string) {
    // salaryService.getSalary updates the currentSalary signal internally
    this.salaryService.getSalary(month).subscribe((res: any) => {
      this.isInherited.set(!!res?.isInherited);
    });

    // Backend expects YYYY-MM-01
    const apiMonth = month.endsWith('-01') ? month : `${month}-01`;
    this.dashData.getMonthly(apiMonth).subscribe(res => {
      this.monthlyTotals.set({
        income: Number(res?.current?.income || 0),
        expense: Number(res?.current?.expense || 0)
      });
    });
  }

  toggleEdit() {
    if (this.editingSalary()) {
      this.editingSalary.set(false);
      return;
    }
    this.editAmount = this.salaryService.currentSalary();
    this.editingSalary.set(true);
  }

  saveSalary() {
    this.salaryService.upsertSalary(this.selectedMonth(), this.editAmount).subscribe(() => {
      this.editingSalary.set(false);
      this.isInherited.set(false);
    });
  }
}
