import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { SettingsService, UserSettings } from '../../services/settings.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatSlideToggleModule,
        MatFormFieldModule,
        MatSelectModule,
        FormsModule,
        MatSnackBarModule
    ],
    templateUrl: './settings.component.html',
})
export class SettingsComponent {
    settingsService = inject(SettingsService);
    snack = inject(MatSnackBar);

    // Form model
    model = signal<UserSettings>({
        theme: 'system',
        currency: 'BDT',
        accentColor: '#6200ee',
        notificationPrefs: { unusualSpending: true, budgetAlerts: true, largeTransactions: true },
        userId: '',
        id: ''
    });

    constructor() {
        effect(() => {
            const s = this.settingsService.settings();
            if (s) {
                this.model.set(JSON.parse(JSON.stringify(s))); // Deep copy
            }
        });
    }

    // Data management
    exportData() {
        // Collect data from services (naively for now, or just export settings/metadata)
        // Ideally we'd fetch all transactions. For now let's export Settings + basic info.
        const data = {
            settings: this.model(),
            timestamp: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    }

    importData(event: any) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e: any) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.settings) {
                    this.model.set(data.settings);
                    this.save(); // Persist imported settings
                    this.snack.open('Settings restored successfully', 'OK', { duration: 3000 });
                }
            } catch (err) {
                this.snack.open('Invalid backup file', 'Error', { duration: 3000 });
            }
        };
        reader.readAsText(file);
    }

    save() {
        this.settingsService.update(this.model()).subscribe(() => {
            this.snack.open('Settings saved', 'OK', { duration: 2000 });
            localStorage.setItem('theme', this.model().theme);
            // Reload to apply theme if needed, or preferably just use a ThemeService signal
            if (this.model().theme !== localStorage.getItem('theme')) {
                window.location.reload();
            }
        });
    }
}
