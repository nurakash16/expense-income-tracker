import { Component, Input, OnChanges, SimpleChanges, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { SalaryService } from '../../services/salary.service';
import { ApiClientService } from '../../services/api-client.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-monthly-summary',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatMenuModule, FormsModule],
  template: `
    <mat-card class="glass-card mb-4">
      <div class="p-3 d-flex justify-content-between align-items-center glossy-header text-white rounded-top">
        <h6 class="m-0 d-flex align-items-center gap-2">
          <mat-icon class="small-icon">account_balance_wallet</mat-icon>
          Monthly Summary ({{ monthLabel() }})
        </h6>
        <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Menu">
          <mat-icon>more_vert</mat-icon>
        </button>
        <mat-menu #menu="matMenu">
          <button mat-menu-item (click)="toggleEdit()">
            <mat-icon>edit</mat-icon>
            <span>Edit Salary</span>
          </button>
        </mat-menu>
      </div>

      <mat-card-content class="p-3">
        <div class="row g-3">
          <!-- Salary Input/Display -->
          <div class="col-6 col-md-3">
            <small class="text-muted d-block">Base Salary</small>
            <div *ngIf="!editingSalary()" class="fw-bold fs-5 text-primary">
              {{ salaryService.currentSalary() | currency:'BDT' }}
              <mat-icon *ngIf="isInherited()" class="tiny-icon text-muted" title="Carried forward">history</mat-icon>
            </div>
            <div *ngIf="editingSalary()" class="d-flex gap-1 mt-1">
              <input type="number" class="form-control form-control-sm" [(ngModel)]="editAmount">
              <button mat-icon-button color="primary" class="small-btn" (click)="saveSalary()"><mat-icon>check</mat-icon></button>
            </div>
          </div>

          <!-- Total Income -->
          <div class="col-6 col-md-3">
            <small class="text-muted d-block">Total Income</small>
            <div class="fw-bold fs-5 text-success">{{ monthlyIncome() | currency:'BDT' }}</div>
            <small class="text-success opacity-75">+{{ otherIncome() | currency:'BDT' }} extra</small>
          </div>

          <!-- Total Expense -->
          <div class="col-6 col-md-3">
            <small class="text-muted d-block">Total Expense</small>
            <div class="fw-bold fs-5 text-danger">{{ monthlyExpense() | currency:'BDT' }}</div>
          </div>

          <!-- Net Savings & Cumulative -->
          <div class="col-6 col-md-3">
            <div class="p-2 rounded h-100 position-relative overflow-hidden glass-card-stat">
              <div class="d-flex align-items-center gap-2 mb-1 text-info">
                <mat-icon class="icon-sm">savings</mat-icon>
                <span class="small fw-bold text-uppercase tracking-wider">Net Savings</span>
              </div>
              <div class="fs-4 fw-bold mb-0 text-dark">
                {{ savings() | currency:'BDT' }}
              </div>
              <small class="text-muted d-block mt-1">
                 Cumulative: {{ cumulativeSavings() | currency:'BDT' }}
              </small>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .tiny-icon { font-size: 14px; width: 14px; height: 14px; vertical-align: middle; }
    .small-btn { width: 32px; height: 32px; line-height: 32px; }
    .small-btn mat-icon { font-size: 18px; }
    .glass-card {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.5);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .glass-card-stat {
      background: rgba(255, 255, 255, 0.6);
      border: 1px solid rgba(255,255,255,0.4);
    }
    .icon-sm { font-size: 18px; width: 18px; height: 18px; }
    .tracking-wider { letter-spacing: 0.05em; }
  `]
})
export class MonthlySummaryComponent implements OnChanges {
  @Input() month: string = ''; // YYYY-MM

  salaryService = inject(SalaryService);
  private api = inject(ApiClientService);

  editingSalary = signal(false);
  editAmount = 0;
  isInherited = signal(false);

  selectedMonth = signal<string>(new Date().toISOString().slice(0, 7));

  // Data Signals
  private monthlyStats = signal<any>(null);
  private allStats = signal<any[]>([]);

  // Computed Properties derived from API + Salary
  otherIncome = computed(() => Number(this.monthlyStats()?.totalIncome || 0));
  monthlyIncome = computed(() => (this.salaryService.currentSalary() || 0) + this.otherIncome());
  monthlyExpense = computed(() => Number(this.monthlyStats()?.totalExpense || 0));

  savings = computed(() => this.monthlyIncome() - this.monthlyExpense());

  cumulativeSavings = computed(() => {
    const current = this.selectedMonth();
    const sorted = this.allStats().filter(s => s.month <= current);
    return sorted.reduce((acc, curr) => acc + (Number(curr.totalIncome) - Number(curr.totalExpense)), 0);
  });

  monthLabel = computed(() => {
    if (!this.selectedMonth()) return '';
    const date = new Date(this.selectedMonth() + '-01');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  constructor() {
    this.api.get<any[]>('/analytics/rollups').subscribe(res => {
      this.allStats.set(res);
    });
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

    this.api.get<any>(`/analytics/monthly?month=${month}`).subscribe(res => {
      this.monthlyStats.set(res?.totals || {});
    });
  }

  toggleEdit() {
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
