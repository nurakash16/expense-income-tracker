import { Injectable, signal } from '@angular/core';
import { ApiClientService } from './api-client.service';
import { tap } from 'rxjs';

export interface UserSettings {
    id?: string;
    userId?: string;
    theme: string;
    currency: string;
    accentColor: string;
    notificationPrefs: any;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
    settings = signal<UserSettings | null>(null);

    constructor(private api: ApiClientService) {
        this.load();
    }

    load() {
        this.api.get<UserSettings>('/settings').subscribe(res => this.settings.set(res));
    }

    update(partial: Partial<UserSettings>) {
        return this.api.patch<UserSettings>('/settings', partial).pipe(
            tap(res => this.settings.set(res))
        );
    }
}
