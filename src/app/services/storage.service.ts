import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly PREFIX = 'et_';

  get<T>(key: string, fallback: T, maxAgeMs: number = 24 * 60 * 60 * 1000): T {
    const fullKey = this.PREFIX + key;
    const raw = localStorage.getItem(fullKey);
    if (!raw) return fallback;

    try {
      const parsed = JSON.parse(raw);
      // Check if it's the new format { timestamp, data }
      if (parsed && typeof parsed === 'object' && 'timestamp' in parsed && 'data' in parsed) {
        const age = Date.now() - parsed.timestamp;
        if (age > maxAgeMs) {
          this.remove(key); // Expired
          return fallback;
        }
        return parsed.data as T;
      }

      // Fallback for old format (direct data) - treat as valid but maybe migrate?
      // For now just return it.
      return parsed as T;
    } catch {
      return fallback;
    }
  }

  set<T>(key: string, value: T): void {
    const fullKey = this.PREFIX + key;
    const payload = {
      timestamp: Date.now(),
      data: value
    };
    try {
      localStorage.setItem(fullKey, JSON.stringify(payload));
    } catch (e) {
      console.warn('Storage quota exceeded or error', e);
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.PREFIX + key);
    // Also try removing raw key just in case
    localStorage.removeItem(key);
  }
}
