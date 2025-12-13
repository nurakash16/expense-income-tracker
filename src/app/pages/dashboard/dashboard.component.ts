import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed, effect, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TransactionService } from '../../services/transaction.service';
import { CategoryService } from '../../services/category.service';
import { KpiCardsComponent } from './kpi-cards.component';
import { DashboardChartsComponent } from '../../components/dashboard-charts/dashboard-charts.component';
import { MonthlySummaryComponent } from '../../components/monthly-summary/monthly-summary.component';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    KpiCardsComponent,
    DashboardChartsComponent,
    MonthlySummaryComponent,
    MatIconModule,
    MatMenuModule,
    MatButtonModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  stats = signal<any>(null);

  // Filters for KPI Cards
  filterType = signal<'all' | 'income' | 'expense'>('all');
  startMonth = signal<string>('');
  endMonth = signal<string>('');
  filterCategoryId = signal<string>('');
  filterPayment = signal<string>('');

  // Feature B: Salary Month Selector (Default current month)
  currentMonth = signal<string>(new Date().toISOString().substring(0, 7)); // YYYY-MM

  categoryChoices = computed(() => {
    const t = this.filterType();
    const cats = this.cats.categories();
    if (t === 'all') return cats;
    return cats.filter((c: any) => c.type === 'both' || c.type === t);
  });

  constructor(public tx: TransactionService, public cats: CategoryService) { }

  ngOnInit() {
    this.cats.getAll().subscribe({ error: () => { } });
    this.reloadStats();

    // Refresh stats when transactions change
    effect(() => {
      const _ = this.tx.transactions();
      this.reloadStats();
    });
  }

  reloadStats() {
    const params: any = {};
    if (this.startMonth()) params.start = this.startMonth();
    if (this.endMonth()) params.end = this.endMonth();
    if (this.filterType() !== 'all') params.type = this.filterType();
    if (this.filterCategoryId()) params.categoryId = this.filterCategoryId();

    this.tx.getDashboardStats(params).subscribe({
      next: (data) => this.stats.set(data),
      error: (err) => console.error('Failed to load stats', err)
    });
  }

  // Filter setters
  onFilterTypeChange(val: any) { this.filterType.set(val); this.reloadStats(); }
  onStartMonthChange(val: any) { this.startMonth.set(val); this.reloadStats(); }
  onEndMonthChange(val: any) { this.endMonth.set(val); this.reloadStats(); }
}
