import { Injectable, signal } from '@angular/core';
import { Observable, tap, timeout } from 'rxjs';
import { ApiClientService } from './api-client.service';

export type NotificationItem = {
    id: string;
    type: string;
    title: string;
    message: string;
    meta?: any;
    readAt?: string | null;
    createdAt: string;
};

@Injectable({ providedIn: 'root' })
export class NotificationsService {
    unread = signal<number>(0);
    items = signal<NotificationItem[]>([]);

    constructor(private api: ApiClientService) { }

    private recomputeUnreadFromItems(): number {
        const count = (this.items() || []).filter(n => !n.readAt).length;
        this.unread.set(count);
        return count;
    }

    list(take = 50, skip = 0, opts?: { force?: boolean }): Observable<any> {
        const params: Record<string, any> = { take, skip };
        // Add a tiny cache-buster when explicitly requested so refresh pulls fresh data
        if (opts?.force) {
            params['_'] = Date.now();
        }
        return this.api.get<any>(`/notifications`, { params }).pipe(
            timeout({ first: 6000 }),
            tap((res) => {
                const items = this.extractItems(res);
                this.items.set(items);
                this.recomputeUnreadFromItems();
            })
        );
    }

    private extractItems(res: any): NotificationItem[] {
        if (Array.isArray(res)) return res as NotificationItem[];
        if (Array.isArray(res?.items)) return res.items as NotificationItem[];
        if (Array.isArray(res?.data)) return res.data as NotificationItem[];
        if (Array.isArray(res?.data?.items)) return res.data.items as NotificationItem[];
        if (Array.isArray(res?.notifications)) return res.notifications as NotificationItem[];
        return [];
    }

    fetchUnread() {
        if (this.items().length) {
            this.recomputeUnreadFromItems();
            return;
        }
        this.list(200, 0, { force: true }).subscribe({ error: () => { } });
    }

    unreadCount(): Observable<{ count: number }> {
        return this.api.get<{ count: number }>(`/notifications/unread-count`);
    }

    markRead(id: string) {
        // Optimistically flag as read locally
        this.items.update(list => list.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
        this.recomputeUnreadFromItems();
        return this.api.post<{ count?: number }>(`/notifications/${id}/read`, {}).pipe(
            tap((r) => {
                if (typeof r?.count === 'number') {
                    this.unread.set(r.count);
                } else {
                    this.recomputeUnreadFromItems();
                }
            })
        );
    }

    markAllRead() {
        // Optimistically flag all as read locally
        const nowIso = new Date().toISOString();
        this.items.update(list => list.map(n => ({ ...n, readAt: nowIso })));
        this.recomputeUnreadFromItems();
        return this.api.post<{ count?: number }>(`/notifications/read-all`, {}).pipe(
            tap((r) => {
                if (typeof r?.count === 'number') {
                    this.unread.set(r.count);
                } else {
                    this.recomputeUnreadFromItems();
                }
            })
        );
    }
}
