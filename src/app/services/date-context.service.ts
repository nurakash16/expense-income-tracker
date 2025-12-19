import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class DateContextService {
  readonly month = signal<string>(this.currentMonthStr());
  readonly monthsBack = signal<number>(6);

  private readonly MONTH_KEY = 'GLOBAL_SELECTED_MONTH';
  private readonly RANGE_KEY = 'GLOBAL_MONTHS_BACK';

  constructor(private storage: StorageService) {
    const storedMonth = this.storage.get<string>(this.MONTH_KEY, this.month());
    const storedRange = this.storage.get<number>(this.RANGE_KEY, this.monthsBack());
    this.month.set(storedMonth || this.currentMonthStr());
    this.monthsBack.set(storedRange || 6);
  }

  /** Call once per session to ensure defaults are hydrated and persisted. */
  ensureDefaults() {
    if (!this.month()) {
      this.setMonth(this.currentMonthStr());
    } else {
      this.storage.set(this.MONTH_KEY, this.month());
    }

    const range = this.monthsBack();
    if (!range || range <= 0) {
      this.setMonthsBack(6);
    } else {
      this.storage.set(this.RANGE_KEY, range);
    }
  }

  setMonth(val: string) {
    const month = val || this.currentMonthStr();
    this.month.set(month);
    this.storage.set(this.MONTH_KEY, month);
  }

  setMonthsBack(n: number) {
    this.monthsBack.set(n);
    this.storage.set(this.RANGE_KEY, n);
  }

  currentMonthStr() {
    return new Date().toISOString().slice(0, 7);
  }
}
