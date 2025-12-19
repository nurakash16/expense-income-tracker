import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { CategoryService } from '../../services/category.service';
import { TransactionService } from '../../services/transaction.service';
import { NotificationsService } from '../../services/notifications.service';
import { ThemeService } from '../../services/theme.service';
import { SettingsService } from '../../services/settings.service';
import { AnalyticsService } from '../../services/analytics.service';
import { BottomNavComponent } from '../../components/bottom-nav/bottom-nav.component';

@Component({
  standalone: true,
  imports: [RouterModule, BottomNavComponent, CommonModule, FormsModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
})
export class LayoutComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private cats = inject(CategoryService);
  private tx = inject(TransactionService);
  private ns = inject(NotificationsService);
  public themeService = inject(ThemeService);
  private settingsSvc = inject(SettingsService);
  private analytics = inject(AnalyticsService);

  sidebarOpen = signal(false);
  dataMenuOpen = signal(false);
  reportBusy = signal(false);
  dataMessage = signal('');
  reportStart = signal('');
  reportEnd = signal('');
  unreadCount = this.ns.unread;
  pageTitle = signal('Overview');
  pageSubtitle = signal('Your daily snapshot');
  displayName = computed(() => {
    const account = this.settingsSvc.account();
    const name = account?.displayName?.trim();
    if (name) return name;
    const email = account?.email?.trim();
    if (email) return email.split('@')[0];
    return 'User';
  });
  userInitials = computed(() => {
    const base = this.displayName().trim() || 'User';
    const parts = base.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || 'U';
    const second = parts[1]?.[0] || (parts[0]?.[1] ?? '');
    return (first + second).toUpperCase();
  });

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  ngOnInit() {
    // Prime caches once after auth guard passes so dashboard/transactions render instantly
    this.cats.getAll().subscribe({ error: () => { } });
    this.tx.getAll(undefined, { force: true }).subscribe({ error: () => { } });
    this.ns.fetchUnread();

    // Refresh unread count when navigation completes to keep badge in sync
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.ns.fetchUnread();
      if (this.router.url.startsWith('/notifications')) {
        this.ns.list(50, 0, { force: true }).subscribe({ error: () => {} });
      }
      this.updatePageTitle(this.router.url);
    });
    this.updatePageTitle(this.router.url);
    this.initReportRange();
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
    this.dataMenuOpen.set(false);
  }

  onNotificationsClick(event: Event) {
    // Prefetch list once so opening the page shows data immediately
    if (!this.ns.items().length) {
      this.ns.list().subscribe({ error: () => { } });
    }
    this.ns.fetchUnread();
    this.closeSidebar();
  }

  toggleDataMenu(event: Event) {
    event.stopPropagation();
    this.dataMenuOpen.update(v => !v);
  }

  exportReportCsv() {
    const startMonth = this.reportStart() || this.defaultStartMonth();
    const endMonth = this.reportEnd() || this.defaultEndMonth();
    const [safeStart, safeEnd] = this.normalizeMonthRange(startMonth, endMonth);
    const startDate = `${safeStart}-01`;
    const endDate = this.endOfMonth(safeEnd);
    const months = this.monthsBetween(safeStart, safeEnd);

    this.reportBusy.set(true);

    forkJoin({
      tx: this.tx.getAll({ start: startDate, end: endDate }).pipe(catchError(() => of([]))),
      kpi: this.analytics.kpis({ start: startDate, end: endDate }).pipe(catchError(() => of(null))),
      overview: this.analytics.overview({ months, end: safeEnd }).pipe(catchError(() => of(null))),
      rollups: this.analytics.rollups({ start: safeStart, end: safeEnd }).pipe(catchError(() => of(null))),
      waterfall: this.analytics.waterfall({ start: safeStart, end: safeEnd }).pipe(catchError(() => of(null))),
    }).subscribe({
      next: (res) => {
        const csv = this.buildReportCsv({
          startDate,
          endDate,
          kpi: res.kpi,
          overview: res.overview,
          rollups: res.rollups,
          waterfall: res.waterfall,
          transactions: Array.isArray(res.tx) ? res.tx : [],
        });
        this.downloadCsv(csv, `report_${safeStart}_to_${safeEnd}.csv`);
        this.flashMessage('Report exported');
      },
      error: () => this.flashMessage('Report export failed'),
      complete: () => {
        this.reportBusy.set(false);
        this.dataMenuOpen.set(false);
      }
    });
  }

  private downloadCsv(csv: string, filename: string) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }

  private buildReportCsv(payload: {
    startDate: string;
    endDate: string;
    kpi: any;
    overview: any;
    rollups: any;
    waterfall: any;
    transactions: any[];
  }) {
    const lines: string[] = [];
    const esc = (val: any) => {
      const s = val === null || val === undefined ? '' : String(val);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    lines.push('Section,Key,Value');
    lines.push(`Report,Range Start,${esc(payload.startDate)}`);
    lines.push(`Report,Range End,${esc(payload.endDate)}`);
    lines.push(`Report,Generated At,${esc(new Date().toISOString())}`);

    const totals = payload.overview?.totals || payload.kpi?.totals || {};
    lines.push(`Summary,Total Income,${esc(totals.income ?? totals.totalIncome ?? '')}`);
    lines.push(`Summary,Total Expense,${esc(totals.expense ?? totals.totalExpense ?? '')}`);
    lines.push(`Summary,Net,${esc(totals.net ?? '')}`);
    lines.push(`Summary,Savings Rate %,${esc(payload.overview?.savingsRate ?? '')}`);

    const topCats = payload.kpi?.topExpenseCategories || [];
    if (topCats.length) {
      lines.push(`Summary,Top Expense Categories,${esc('')}`);
      topCats.forEach((c: any, idx: number) => {
        lines.push(`TopExpense,${esc(c.name || `Category ${idx + 1}`)},${esc(c.value ?? c.amount ?? '')}`);
      });
    }

    if (payload.rollups) {
      lines.push(`Summary,Rollups,${esc(JSON.stringify(payload.rollups))}`);
    }
    if (payload.waterfall?.months?.length) {
      lines.push('');
      lines.push('Waterfall');
      lines.push('Month,Income,Expense,Net');
      payload.waterfall.months.forEach((m: string, i: number) => {
        lines.push([m, payload.waterfall.income?.[i] ?? 0, payload.waterfall.expense?.[i] ?? 0, payload.waterfall.net?.[i] ?? 0].map(esc).join(','));
      });
    }

    lines.push('');
    lines.push('Transactions');
    lines.push('Date,Type,Category,Amount,Method,Note');
    const catMap = new Map<string, string>();
    this.cats.categories().forEach((c: any) => catMap.set(String(c.id), c.name));
    (payload.transactions || []).forEach((t: any) => {
      const row = [
        String(t.date || '').slice(0, 10),
        t.type,
        catMap.get(String(t.categoryId || '')) || 'Uncategorized',
        t.amount,
        t.paymentMethod || '',
        t.note || ''
      ];
      lines.push(row.map(esc).join(','));
    });

    return lines.join('\n');
  }

  private initReportRange() {
    if (!this.reportEnd()) {
      this.reportEnd.set(this.defaultEndMonth());
    }
    if (!this.reportStart()) {
      this.reportStart.set(this.defaultStartMonth());
    }
  }

  private defaultEndMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private defaultStartMonth() {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    return `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
  }

  private normalizeMonthRange(start: string, end: string) {
    if (!start || !end) return [start, end];
    return start <= end ? [start, end] : [end, start];
  }

  private endOfMonth(yyyyMM: string) {
    const [y, m] = yyyyMM.split('-').map(Number);
    const last = new Date(y, m, 0);
    const mm = String(m).padStart(2, '0');
    const dd = String(last.getDate()).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }

  private monthsBetween(start: string, end: string) {
    const [sy, sm] = start.split('-').map(Number);
    const [ey, em] = end.split('-').map(Number);
    return Math.max(1, (ey - sy) * 12 + (em - sm) + 1);
  }

  private flashMessage(message: string) {
    this.dataMessage.set(message);
    setTimeout(() => this.dataMessage.set(''), 2500);
  }

  private updatePageTitle(url: string) {
    const path = url.split('?')[0].replace(/\/+$/, '');
    const map: Record<string, { title: string; subtitle?: string }> = {
      '/dashboard': { title: 'Overview', subtitle: 'Your daily snapshot' },
      '/transactions': { title: 'Transactions', subtitle: 'Track every record' },
      '/categories': { title: 'Categories', subtitle: 'Organize your finances' },
      '/reports': { title: 'Reports', subtitle: 'Trends and insights' },
      '/insights': { title: 'Insights', subtitle: 'Patterns that stand out' },
      '/notifications': { title: 'Notifications', subtitle: 'What needs attention' },
      '/settings': { title: 'Settings', subtitle: 'Manage preferences' },
    };
    const entry = map[path] || { title: 'Overview', subtitle: 'Your daily snapshot' };
    this.pageTitle.set(entry.title);
    this.pageSubtitle.set(entry.subtitle || '');
  }
}
