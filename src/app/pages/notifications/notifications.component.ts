import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsService, NotificationItem } from '../../services/notifications.service';

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="container py-3">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3 class="m-0">Notifications</h3>
        <button class="btn btn-outline-secondary btn-sm" (click)="readAll()">Mark all read</button>
      </div>

      <div *ngIf="loading">Loading...</div>

      <div *ngFor="let n of items" class="card mb-2" [class.opacity-50]="n.readAt">
        <div class="card-body">
          <div class="d-flex justify-content-between">
            <div>
              <div class="fw-bold">{{ n.title }}</div>
              <div class="text-muted small">{{ n.type }} · {{ n.createdAt | date:'medium' }}</div>
            </div>
            <button class="btn btn-sm btn-primary" *ngIf="!n.readAt" (click)="read(n)">Read</button>
          </div>
          <div class="mt-2">{{ n.message }}</div>
        </div>
      </div>
    </div>
  `
})
export class NotificationsComponent {
    items: NotificationItem[] = [];
    loading = true;

    constructor(private ns: NotificationsService) {
        this.refresh();
    }

    refresh() {
        this.loading = true;
        this.ns.list().subscribe({
            next: (r) => { this.items = r.items; this.loading = false; },
            error: () => { this.loading = false; }
        });
    }

    read(n: NotificationItem) {
        this.ns.markRead(n.id).subscribe(() => this.refresh());
    }

    readAll() {
        this.ns.markAllRead().subscribe(() => this.refresh());
    }
}
