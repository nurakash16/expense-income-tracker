import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Transaction } from '../models/transaction.model';
import { tap, of } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  transactions = signal<Transaction[]>([]);

  constructor(private http: HttpClient, private api: ApiClientService, private storage: StorageService) {
    this.transactions.set(this.storage.get<Transaction[]>('CACHE_TRANSACTIONS', []));
    // Load stats cache if useful, or leave it memory-only for now (since it depends on params)
    const cachedStats = this.storage.get('CACHE_STATS', null);
    if (cachedStats) this._statsCache.set('DEFAULT', cachedStats);
  }

  getAll(params?: { type?: 'income' | 'expense'; start?: string; end?: string; q?: string }, opts: { force?: boolean } = {}) {
    // Always fetch to ensure we have the latest data (Background Refresh)
    const query = new URLSearchParams(params as any).toString();
    const url = `/transactions${query ? `?${query}` : ''}`;
    return this.api.get<Transaction[]>(url).pipe(
      tap((list) => {
        if (!params) { // Only cache full list
          this.transactions.set(list);
          this.storage.set('CACHE_TRANSACTIONS', list.slice(0, 100)); // Limit to last 100
        } else {
          this.transactions.set(list); // Update signal even if filtered? Maybe not.
          // Usually signal holds "current view".
        }
      })
    );
  }

  create(tx: Transaction) {
    return this.api.post<Transaction>(`/transactions`, tx)
      .pipe(tap(newTx => this.transactions.update(list => [newTx, ...list])));
  }

  update(id: string, patch: Partial<Transaction>) {
    return this.api.put<Transaction>(`/transactions/${id}`, patch)
      .pipe(tap(updated => this.transactions.update(list => list.map(t => t.id === id ? updated : t))));
  }

  delete(id: string) {
    return this.api.delete(`/transactions/${id}`)
      .pipe(tap(() => this.transactions.update(list => list.filter(t => t.id !== id))));
  }

  exportCsv() {
    // Backend route is `/transactions/export/csv`
    return this.api.getBlob(`/transactions/export/csv`);
  }

  private _statsCache = new Map<string, any>();
  getDashboardStats(params?: { start?: string; end?: string; type?: string; categoryId?: string; paymentMethod?: string }) {
    const key = JSON.stringify(params || {});
    if (this._statsCache.has(key)) {
      return of(this._statsCache.get(key));
    }
    return this.api.get<any>(`/transactions/dashboard/stats`, { params })
      .pipe(tap((res) => this._statsCache.set(key, res)));
  }
}
