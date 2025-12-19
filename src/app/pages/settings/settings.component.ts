import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent {
  private settingsSvc = inject(SettingsService);
  public themeSvc = inject(ThemeService);

  displayName = signal<string>('');
  email = signal<string>('');
  currency = signal<string>('BDT');

  currentPassword = signal<string>('');
  newPassword = signal<string>('');
  confirmPassword = signal<string>('');

  status = signal<string>('');
  error = signal<string>('');

  constructor() {
    effect(() => {
      const acc = this.settingsSvc.account();
      if (acc) {
        this.displayName.set(acc.displayName || '');
        this.email.set(acc.email || '');
      }
    });

    effect(() => {
      const s = this.settingsSvc.settings();
      if (s) {
        if (s.currency) this.currency.set(s.currency);
        if (s.theme === 'dark' || s.theme === 'light') {
          this.themeSvc.theme.set(s.theme);
        }
      }
    });
  }

  saveProfile() {
    this.clearMessages();
    this.settingsSvc.updateAccount(this.displayName()).subscribe({
      next: () => this.status.set('Profile updated'),
      error: (err) => this.error.set(err?.error?.message || 'Failed to update profile'),
    });
  }

  savePreferences() {
    this.clearMessages();
    const theme = this.themeSvc.theme();
    this.settingsSvc.update({ theme, currency: this.currency() }).subscribe({
      next: () => this.status.set('Preferences saved'),
      error: (err) => this.error.set(err?.error?.message || 'Failed to save preferences'),
    });
  }

  applyTheme(theme: 'light' | 'dark') {
    this.themeSvc.theme.set(theme);
  }

  changePassword() {
    this.clearMessages();
    if (this.newPassword() !== this.confirmPassword()) {
      this.error.set('Passwords do not match');
      return;
    }
    this.settingsSvc.changePassword(this.currentPassword(), this.newPassword()).subscribe({
      next: (res) => {
        this.status.set(res.message || 'Password changed');
        this.currentPassword.set('');
        this.newPassword.set('');
        this.confirmPassword.set('');
      },
      error: (err) => this.error.set(err?.error?.message || 'Failed to change password'),
    });
  }

  private clearMessages() {
    this.status.set('');
    this.error.set('');
  }
}
