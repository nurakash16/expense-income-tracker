import { Injectable, signal } from '@angular/core';
import { ApiClientService } from './api-client.service';
import { tap } from 'rxjs';

export interface UserSettings {
    id?: string;
    userId?: string;
    theme: string;
    currency: string;
}

export interface AccountInfo {
    email: string;
    displayName: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
    settings = signal<UserSettings | null>(null);
    account = signal<AccountInfo | null>(null);

    constructor(private api: ApiClientService) {
        this.load();
    }

    load() {
        this.api.get<UserSettings>('/settings').subscribe(res => this.settings.set(res));
        this.api.get<AccountInfo>('/settings/account').subscribe(res => this.account.set(res));
    }

    update(partial: Partial<UserSettings>) {
        return this.api.patch<UserSettings>('/settings', partial).pipe(
            tap(res => this.settings.set(res))
        );
    }

    updateAccount(displayName: string) {
        return this.api.patch<AccountInfo>('/settings/account', { displayName }).pipe(
            tap(res => this.account.set(res))
        );
    }

    changePassword(currentPassword: string, newPassword: string) {
        return this.api.post<{ message: string }>('/settings/change-password', { currentPassword, newPassword });
    }
}
