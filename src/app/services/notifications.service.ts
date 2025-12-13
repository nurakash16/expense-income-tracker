import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
    constructor(private http: HttpClient) { }

    list(take = 50, skip = 0): Observable<{ items: NotificationItem[]; total: number }> {
        return this.http.get<{ items: NotificationItem[]; total: number }>(
            `/api/notifications?take=${take}&skip=${skip}`
        );
    }

    unreadCount(): Observable<{ count: number }> {
        return this.http.get<{ count: number }>(`/api/notifications/unread-count`);
    }

    markRead(id: string) {
        return this.http.post(`/api/notifications/${id}/read`, {});
    }

    markAllRead() {
        return this.http.post(`/api/notifications/read-all`, {});
    }
}
