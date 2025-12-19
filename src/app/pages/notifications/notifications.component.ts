import { Component, OnInit, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsService, NotificationItem } from '../../services/notifications.service';
import { finalize } from 'rxjs/operators';
import { TransactionService } from '../../services/transaction.service';
import { Transaction } from '../../models/transaction.model';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-shell">
      <div class="bg-blob blob-a"></div>
      <div class="bg-blob blob-b"></div>
      <div class="bg-blob blob-c"></div>

      <div class="panel">
        <header class="hero">
          <div class="title-stack">
            <div class="eyebrow">
              <span class="dot"></span>
              Executive overview
            </div>
            <h1>Notifications <span class="accent">Cockpit</span></h1>
            <p class="lede">
              Track what changed, where it happened, and how to respond. Switch between all items or just the unread queue.
            </p>
            <div class="stat-chips">
              <div class="chip">
                <span class="chip-label">Total</span>
                <span class="chip-value">{{ items.length }}</span>
              </div>
              <div class="chip">
                <span class="chip-label">Unread</span>
                <span class="chip-value accent-text">{{ unreadCount }}</span>
              </div>
              <div class="chip">
                <span class="chip-label">Latest</span>
                <span class="chip-value">{{ latestTimestamp || '-' }}</span>
              </div>
            </div>
          </div>

          <div class="controls">
            <div class="date-card">
              <div class="card-label">Range</div>
              <div class="filter-row">
                <div class="pill-toggle" role="group" aria-label="Filter notifications">
                  <button type="button" [class.active]="view === 'all'" (click)="setView('all')">All</button>
                  <button type="button" [class.active]="view === 'unread'" (click)="setView('unread')">Unread</button>
                </div>
                <div class="action-buttons">
                  <button type="button" class="ghost refresh-btn" (click)="refresh()" [disabled]="refreshing">
                    <span class="refresh-spin" *ngIf="refreshing"></span>
                    Refresh
                  </button>
                  <button type="button" class="primary" (click)="readAll()" [disabled]="!unreadCount">Mark all read</button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div class="state" *ngIf="loading && !items.length && !initialized">
          <div class="spinner"></div>
          <div>Fetching your latest notifications...</div>
        </div>
        <div class="state error" *ngIf="error && !items.length">
          <div class="emoji">??</div>
          <div>{{ error }}</div>
        </div>
        <div class="state" *ngIf="!loading && !error && !filteredItems.length">
          <div class="emoji">??</div>
          <div>No {{ view === 'unread' ? 'unread' : '' }} notifications right now.</div>
          <button type="button" class="ghost" (click)="setView('all')" *ngIf="view === 'unread' && items.length">
            Show all
          </button>
        </div>

        <div class="content-grid" *ngIf="filteredItems.length">
          <div class="timeline">
            <div
              class="timeline-row"
              *ngFor="let n of filteredItems; trackBy: trackById"
              [class.read]="n.readAt"
            >
              <div class="rail">
                <span class="rail-dot" [class.read]="n.readAt"></span>
                <span class="rail-line"></span>
              </div>
              <div class="bubble">
                <div class="bubble-top">
                  <div class="pill">{{ n.type | titlecase }}</div>
                  <button
                    type="button"
                    class="ghost small"
                    *ngIf="!n.readAt"
                    (click)="read(n)"
                  >
                    Mark read
                  </button>
                </div>
                <h3>{{ n.title }}</h3>
                <p class="meta">{{ n.createdAt | date:'MMM d, y, h:mm a' }}</p>
                <p class="body">{{ n.message }}</p>
                <p class="amount" *ngIf="amountLabel(n) as amount">{{ amount }}</p>
              </div>
            </div>
          </div>
          <aside class="side-panel">
            <div class="side-card">
              <div class="side-title">Queue summary</div>
              <div class="side-row">
                <span>Unread</span>
                <strong>{{ unreadCount }}</strong>
              </div>
              <div class="side-row">
                <span>Total</span>
                <strong>{{ items.length }}</strong>
              </div>
              <div class="side-row">
                <span>Latest</span>
                <strong>{{ latestTimestamp || '-' }}</strong>
              </div>
            </div>
            <div class="side-card ghost-card" *ngIf="unreadCount">
              <div class="side-title">Clear the deck</div>
              <p class="side-copy">Mark everything as read once you're done reviewing.</p>
              <button type="button" class="primary block" (click)="readAll()">Mark all read</button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(135deg, #f7f9ff 0%, #ffffff 60%, #fef7ff 100%);
      color: #0f172a;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      overflow-x: hidden;
    }
    .page-shell {
      position: relative;
      padding: 18px;
      max-width: 1100px;
      margin: 0 auto 24px;
      width: 100%;
    }
    .bg-blob {
      position: absolute;
      width: 420px;
      height: 420px;
      filter: blur(90px);
      opacity: 0.6;
      z-index: 0;
    }
    .blob-a { background: radial-gradient(circle at 30% 30%, #c1d0ff, transparent 65%); top: 0; left: -80px; }
    .blob-b { background: radial-gradient(circle at 70% 20%, #c9ffe6, transparent 65%); top: -40px; right: -60px; }
    .blob-c { background: radial-gradient(circle at 70% 70%, #ffd8ea, transparent 65%); bottom: -60px; right: 0; }

    .panel {
      position: relative;
      z-index: 1;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.6);
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
      border-radius: 18px;
      padding: 18px;
    }
    .hero {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
      align-items: center;
      margin-bottom: 8px;
    }
    .title-stack h1 {
      font-size: 30px;
      margin: 10px 0 6px;
      letter-spacing: -0.4px;
    }
    .accent { color: #4f46e5; }
    .lede {
      margin: 0;
      color: #475569;
      max-width: 560px;
    }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      background: linear-gradient(120deg, #e0e7ff, #e0f2fe);
      border-radius: 999px;
      font-size: 12px;
      letter-spacing: 0.02em;
      font-weight: 700;
      text-transform: uppercase;
      color: #334155;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: radial-gradient(circle, #4f46e5 0%, #22c55e 80%);
      box-shadow: 0 0 12px rgba(79, 70, 229, 0.5);
    }
    .controls {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-end;
    }
    .stat-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-start;
      margin-top: 8px;
    }
    .date-card {
      background: rgba(255,255,255,0.92);
      border: 1px solid rgba(15,23,42,0.06);
      border-radius: 14px;
      padding: 10px 12px;
      box-shadow: 0 10px 24px rgba(15,23,42,0.05);
    }
    .card-label {
      font-size: 12px;
      font-weight: 800;
      color: #475569;
      margin-bottom: 6px;
    }
    .chip {
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(15, 23, 42, 0.05);
      border-radius: 12px;
      padding: 10px 12px;
      min-width: 120px;
      box-shadow: 0 12px 26px rgba(15, 23, 42, 0.06);
    }
    .chip-label {
      display: block;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #64748b;
      font-weight: 800;
    }
    .chip-value {
      display: block;
      font-weight: 900;
      margin-top: 4px;
      color: #0f172a;
    }
    .accent-text { color: #22c55e; }

    .filter-row {
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .pill-toggle {
      display: inline-flex;
      padding: 6px;
      border-radius: 999px;
      background: #f1f5f9;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
      gap: 4px;
    }
    .pill-toggle button {
      border: none;
      background: transparent;
      padding: 10px 16px;
      border-radius: 999px;
      font-weight: 700;
      color: #334155;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .pill-toggle button.active {
      background: #0f172a;
      color: #fff;
      box-shadow: 0 14px 28px rgba(15, 23, 42, 0.35);
      transform: translateY(-1px);
    }
    .action-buttons {
      display: flex;
      gap: 8px;
    }
    .primary, .ghost {
      border-radius: 12px;
      border: none;
      padding: 12px 16px;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
    }
    .primary {
      background: linear-gradient(135deg, #4f46e5, #22c55e);
      color: #fff;
      box-shadow: 0 14px 30px rgba(79, 70, 229, 0.35);
    }
    .primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }
    .ghost {
      background: rgba(15, 23, 42, 0.05);
      color: #0f172a;
      border: 1px solid rgba(15, 23, 42, 0.08);
    }
    .primary:not(:disabled):hover,
    .ghost:hover { transform: translateY(-1px); }
    .ghost.small {
      padding: 8px 12px;
      font-size: 13px;
    }
    .refresh-btn{
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .refresh-spin{
      width: 14px;
      height: 14px;
      border: 2px solid rgba(15, 23, 42, 0.2);
      border-top-color: #0f172a;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .state {
      margin-top: 18px;
      padding: 20px;
      border-radius: 14px;
      background: rgba(248, 250, 252, 0.9);
      border: 1px dashed rgba(148, 163, 184, 0.6);
      color: #334155;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .state.error {
      border-color: rgba(239, 68, 68, 0.5);
      color: #b91c1c;
    }
    .refresh-chip {
      margin-top: 14px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(248, 250, 252, 0.9);
      border: 1px solid rgba(148, 163, 184, 0.5);
      color: #334155;
      width: max-content;
    }
    .emoji { font-size: 20px; }
    .spinner {
      width: 18px;
      height: 18px;
      border: 3px solid rgba(15, 23, 42, 0.1);
      border-top-color: #0f172a;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .spinner.tiny {
      width: 14px;
      height: 14px;
      border-width: 2px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1.7fr 0.9fr;
      gap: 16px;
      margin-top: 18px;
      align-items: start;
    }
    .timeline {
      position: relative;
      padding-left: 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .timeline-row {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 12px;
      align-items: start;
    }
    .rail {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .rail-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4f46e5, #22c55e);
      box-shadow: 0 0 0 6px rgba(79, 70, 229, 0.14);
    }
    .rail-dot.read {
      background: #cbd5e1;
      box-shadow: none;
    }
    .rail-line {
      flex: 1;
      width: 2px;
      background: linear-gradient(180deg, rgba(79, 70, 229, 0.25), rgba(34, 197, 94, 0.14));
      min-height: 60px;
    }
    .bubble {
      background: #ffffff;
      border-radius: 14px;
      padding: 14px;
      box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
      border: 1px solid rgba(15, 23, 42, 0.05);
      display: flex;
      flex-direction: column;
      gap: 8px;
      position: relative;
    }
    .timeline-row.read .bubble {
      background: #f8fafc;
      opacity: 0.88;
    }
    .bubble-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
    .pill {
      display: inline-block;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(79, 70, 229, 0.08);
      color: #4338ca;
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    h3 {
      margin: 4px 0 2px;
      font-size: 17px;
      color: #0f172a;
    }
    .meta {
      margin: 0;
      color: #64748b;
      font-size: 13px;
    }
    .body {
      margin: 0;
      color: #1e293b;
      line-height: 1.5;
    }
    .amount{
      margin: 0;
      font-weight: 700;
      color: #0f172a;
    }

    .side-panel {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .side-card {
      background: #f8fafc;
      border: 1px solid rgba(15, 23, 42, 0.05);
      border-radius: 14px;
      padding: 14px;
      box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
    }
    .side-title {
      font-weight: 900;
      color: #0f172a;
      margin-bottom: 10px;
    }
    .side-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid rgba(15, 23, 42, 0.05);
    }
    .side-row:last-child { border-bottom: none; }
    .side-copy {
      margin: 0 0 10px;
      color: #475569;
    }
    .ghost-card {
      background: linear-gradient(135deg, rgba(79,70,229,0.08), rgba(34,197,94,0.08));
      border: 1px solid rgba(79, 70, 229, 0.15);
    }
    .primary.block {
      width: 100%;
      text-align: center;
    }

    :host-context([data-bs-theme="dark"]) {
      background: linear-gradient(135deg, #0b1221 0%, #0f172a 60%, #111827 100%);
      color: #e5e7eb;
    }
    :host-context([data-bs-theme="dark"]) .panel {
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(148, 163, 184, 0.2);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
    }
    :host-context([data-bs-theme="dark"]) .eyebrow {
      background: linear-gradient(120deg, rgba(99, 102, 241, 0.25), rgba(14, 165, 233, 0.2));
      color: #e2e8f0;
    }
    :host-context([data-bs-theme="dark"]) .lede,
    :host-context([data-bs-theme="dark"]) .card-label,
    :host-context([data-bs-theme="dark"]) .chip-label,
    :host-context([data-bs-theme="dark"]) .meta,
    :host-context([data-bs-theme="dark"]) .side-copy {
      color: #94a3b8;
    }
    :host-context([data-bs-theme="dark"]) .title-stack h1,
    :host-context([data-bs-theme="dark"]) .chip-value,
    :host-context([data-bs-theme="dark"]) .bubble h3,
    :host-context([data-bs-theme="dark"]) .side-title {
      color: #f8fafc;
    }
    :host-context([data-bs-theme="dark"]) .date-card,
    :host-context([data-bs-theme="dark"]) .chip {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(148, 163, 184, 0.2);
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
    }
    :host-context([data-bs-theme="dark"]) .pill-toggle {
      background: rgba(15, 23, 42, 0.7);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }
    :host-context([data-bs-theme="dark"]) .pill-toggle button {
      color: #cbd5f5;
    }
    :host-context([data-bs-theme="dark"]) .pill-toggle button.active {
      background: #f8fafc;
      color: #0f172a;
      box-shadow: 0 14px 28px rgba(0, 0, 0, 0.45);
    }
    :host-context([data-bs-theme="dark"]) .ghost {
      background: rgba(148, 163, 184, 0.12);
      color: #e2e8f0;
      border: 1px solid rgba(148, 163, 184, 0.2);
    }
    :host-context([data-bs-theme="dark"]) .refresh-spin {
      border-color: rgba(148, 163, 184, 0.3);
      border-top-color: #e2e8f0;
    }
    :host-context([data-bs-theme="dark"]) .state,
    :host-context([data-bs-theme="dark"]) .refresh-chip {
      background: rgba(15, 23, 42, 0.8);
      border-color: rgba(148, 163, 184, 0.35);
      color: #cbd5f5;
    }
    :host-context([data-bs-theme="dark"]) .state.error {
      border-color: rgba(248, 113, 113, 0.5);
      color: #fca5a5;
    }
    :host-context([data-bs-theme="dark"]) .spinner {
      border-color: rgba(148, 163, 184, 0.3);
      border-top-color: #e2e8f0;
    }
    :host-context([data-bs-theme="dark"]) .bubble {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(148, 163, 184, 0.2);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
    }
    :host-context([data-bs-theme="dark"]) .timeline-row.read .bubble {
      background: rgba(15, 23, 42, 0.65);
    }
    :host-context([data-bs-theme="dark"]) .pill {
      background: rgba(99, 102, 241, 0.18);
      color: #c7d2fe;
    }
    :host-context([data-bs-theme="dark"]) .body {
      color: #e2e8f0;
    }
    :host-context([data-bs-theme="dark"]) .amount{
      color: #f8fafc;
    }
    :host-context([data-bs-theme="dark"]) .rail-dot.read {
      background: #475569;
    }
    :host-context([data-bs-theme="dark"]) .side-card {
      background: rgba(15, 23, 42, 0.78);
      border: 1px solid rgba(148, 163, 184, 0.2);
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4);
    }
    :host-context([data-bs-theme="dark"]) .ghost-card {
      background: linear-gradient(135deg, rgba(99,70,229,0.18), rgba(34,197,94,0.16));
      border: 1px solid rgba(99, 102, 241, 0.25);
    }

    @media (max-width: 900px) {
      .hero {
        grid-template-columns: 1fr;
      }
      .controls { align-items: flex-start; }
      .panel { padding: 16px; }
      .content-grid {
        grid-template-columns: 1fr;
      }
      .side-panel {
        flex-direction: row;
        flex-wrap: wrap;
      }
      .side-card {
        flex: 1 1 240px;
      }
    }

    @media (max-width: 600px) {
      .page-shell { padding: 12px; }
      .panel { padding: 14px; }
      .title-stack h1 { font-size: 24px; }
      .lede { font-size: 13px; }
      .controls { width: 100%; }
      .date-card { width: 100%; }
      .stat-chips { flex-direction: column; }
      .chip { min-width: 0; width: 100%; }
      .filter-row { flex-direction: column; align-items: stretch; }
      .pill-toggle { width: 100%; justify-content: space-between; }
      .pill-toggle button { flex: 1 1 0; text-align: center; }
      .action-buttons { width: 100%; flex-wrap: wrap; }
      .action-buttons button { flex: 1 1 140px; }
      .content-grid { gap: 12px; }
      .timeline { padding-left: 10px; }
      .timeline-row { grid-template-columns: 1fr; }
      .rail { flex-direction: row; justify-content: flex-start; }
      .rail-line { display: none; }
      .bubble { padding: 12px; }
      .side-panel { flex-direction: column; }
    }
  `]
})
export class NotificationsComponent implements OnInit {
  items: NotificationItem[] = [];
  loading = true;
  error = '';
  view: 'all' | 'unread' = 'all';
  refreshing = false;
  initialized = false;
  private refreshTimer: any = null;
  private txIndex = computed(() => {
    const map = new Map<string, Transaction>();
    for (const tx of this.txService.transactions()) {
      map.set(tx.id, tx);
    }
    return map;
  });

  constructor(
    private ns: NotificationsService,
    private txService: TransactionService,
    private settingsService: SettingsService
  ) {
    // Keep local items in sync with the shared cache so data shows immediately after prefetch.
    effect(() => {
      this.items = this.ns.items();
      if (this.items.length) {
        this.loading = false;
      }
    });
  }

  ngOnInit(): void {
    this.loadInitial();
  }

  refresh(): void {
    this.refreshing = true;
    this.loadNotifications(true);
  }

  private loadInitial(): void {
    this.loading = true;
    this.loadNotifications(false);
  }

  private loadNotifications(showSpinner: boolean): void {
    const hasItems = this.items.length > 0;
    this.loading = !hasItems && !showSpinner;
    this.error = '';
    if (showSpinner) {
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
      }
      this.refreshTimer = setTimeout(() => {
        this.refreshing = false;
      }, 4000);
    }
    this.ns.list(50, 0, { force: true })
      .pipe(finalize(() => {
        this.loading = false;
        if (showSpinner) {
          this.refreshing = false;
        }
        this.initialized = true;
        if (this.refreshTimer) {
          clearTimeout(this.refreshTimer);
          this.refreshTimer = null;
        }
      }))
      .subscribe({
        next: (res: any) => {
          const items = this.extractItems(res);
          this.items = items;
          this.ns.items.set(items);
          this.ns.fetchUnread();
          this.ensureTransactionsForNotifications(items);
          if (showSpinner) {
            this.refreshing = false;
          }
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to load notifications';
          if (showSpinner) {
            this.refreshing = false;
          }
        }
      });
  }

  private extractItems(res: any): NotificationItem[] {
    if (Array.isArray(res)) return res as NotificationItem[];
    if (Array.isArray(res?.items)) return res.items as NotificationItem[];
    if (Array.isArray(res?.data)) return res.data as NotificationItem[];
    if (Array.isArray(res?.data?.items)) return res.data.items as NotificationItem[];
    if (Array.isArray(res?.notifications)) return res.notifications as NotificationItem[];
    if (Array.isArray(res?.data?.notifications)) return res.data.notifications as NotificationItem[];
    return [];
  }

  read(n: NotificationItem): void {
    this.ns.markRead(n.id).subscribe({ error: () => this.refresh() });
  }

  readAll(): void {
    this.ns.markAllRead().subscribe({
      next: () => { this.loading = false; },
      error: () => this.refresh()
    });
  }

  setView(view: 'all' | 'unread'): void {
    this.view = view;
  }

  get filteredItems(): NotificationItem[] {
    const base = this.view === 'all' ? this.items : this.items.filter((n) => !n.readAt);
    return base.filter((n) => this.meetsNotificationCriteria(n));
  }

  get unreadCount(): number {
    return this.items.filter((n) => !n.readAt).length;
  }

  get latestTimestamp(): string {
    if (!this.items.length) {
      return '';
    }
    const latest = this.items.reduce<Date | null>((acc, n) => {
      const date = new Date(n.createdAt);
      if (!acc || date > acc) {
        return date;
      }
      return acc;
    }, null);
    return latest ? latest.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  }

  trackById(_: number, item: NotificationItem): string {
    return item.id;
  }

  amountLabel(n: NotificationItem): string | null {
    const tx = this.getTransactionForNotification(n);
    if (!tx) return null;
    return `Current amount: ${this.formatAmount(tx.amount)}`;
  }

  private getTransactionForNotification(n: NotificationItem): Transaction | null {
    const txId = this.getNotificationTransactionId(n);
    if (!txId) return null;
    return this.txIndex().get(txId) ?? null;
  }

  private getNotificationTransactionId(n: NotificationItem): string | null {
    const meta = (n as any).meta ?? (n as any).data ?? {};
    return (
      (n as any).transactionId ||
      meta.transactionId ||
      meta.txId ||
      meta.transaction_id ||
      meta?.transaction?.id ||
      null
    );
  }

  private ensureTransactionsForNotifications(items: NotificationItem[]): void {
    const ids = items
      .map((n) => this.getNotificationTransactionId(n))
      .filter((id): id is string => Boolean(id));
    if (!ids.length) return;
    const existing = this.txService.transactions();
    const missing = ids.some((id) => !existing.find((tx) => tx.id === id));
    if (missing || !existing.length) {
      this.txService.getAll().subscribe({ error: () => {} });
    }
  }

  private meetsNotificationCriteria(n: NotificationItem): boolean {
    const tx = this.getTransactionForNotification(n);
    if (!tx) return true;
    const meta = (n as any).meta ?? (n as any).data ?? {};
    const threshold = Number(meta.threshold ?? meta.minAmount ?? meta.limit ?? NaN);
    if (Number.isFinite(threshold)) {
      return Math.abs(tx.amount) >= threshold;
    }
    return true;
  }

  private formatAmount(amount: number): string {
    const currency = this.settingsService.settings()?.currency || 'BDT';
    return amount.toLocaleString(undefined, { style: 'currency', currency, maximumFractionDigits: 0 });
  }
}






