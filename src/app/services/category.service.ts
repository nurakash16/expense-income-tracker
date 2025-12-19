import { Injectable, signal } from '@angular/core';
import { ApiClientService } from './api-client.service';
import { StorageService } from './storage.service';
import { Category } from '../models/category.model';
import { tap, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  categories = signal<Category[]>([]);

  constructor(private api: ApiClientService, private storage: StorageService) {
    this.categories.set(this.storage.get<Category[]>('CACHE_CATEGORIES', []));
  }

  getAll(force = false) {
    // Always fetch directly to update the cache and signal
    return this.api.get<Category[]>(`/categories`).pipe(
      tap((list) => {
        this.categories.set(list);
        this.storage.set('CACHE_CATEGORIES', list);
      })
    );
  }

  create(cat: Partial<Category>) {
    const payload: any = {
      name: String((cat as any)?.name ?? '').trim(),
      type: String((cat as any)?.type ?? 'expense').toLowerCase(),
      budget: Number((cat as any)?.budget ?? 0),
    };

    if (!payload.name) {
      throw new Error('Category name is required');
    }
    if (!['income', 'expense', 'both'].includes(payload.type)) {
      payload.type = 'expense';
    }
    if (!Number.isFinite(payload.budget)) payload.budget = 0;

    return this.api.post<Category>(`/categories`, payload).pipe(
      tap((newCat) => this.categories.update((list) => [newCat, ...list]))
    );
  }

  update(id: string, cat: Partial<Category>) {
    const payload: any = {
      name: cat.name !== undefined ? String((cat as any).name ?? '').trim() : undefined,
      type: cat.type !== undefined ? String((cat as any).type ?? '').toLowerCase() : undefined,
      budget: cat.budget !== undefined ? Number((cat as any).budget) : undefined,
    };

    if (payload.type && !['income', 'expense', 'both'].includes(payload.type)) {
      delete payload.type;
    }
    if (payload.budget !== undefined && !Number.isFinite(payload.budget)) {
      payload.budget = 0;
    }

    return this.api.put<Category>(`/categories/${id}`, payload).pipe(
      tap((updatedCat) => {
        this.categories.update((list) => list.map((c) => (c.id === id ? updatedCat : c)));
      })
    );
  }

  delete(id: string) {
    return this.api.delete(`/categories/${id}`).pipe(
      tap(() => this.categories.update((list) => list.filter((c) => c.id !== id)))
    );
  }

  ensureSavingsCategory() {
    const existing = (this.categories() || []).find(
      (c) => c.name?.toLowerCase() === 'savings'
    );
    if (existing) {
      return of(existing);
    }
    return this.create({ name: 'Savings', type: 'both' });
  }
}
