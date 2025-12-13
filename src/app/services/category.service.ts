import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ApiClientService } from './api-client.service';
import { StorageService } from './storage.service';
import { Category } from '../models/category.model';
import { tap, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  categories = signal<Category[]>([]);

  constructor(private http: HttpClient, private api: ApiClientService, private storage: StorageService) {
    this.categories.set(this.storage.get<Category[]>('CACHE_CATEGORIES', []));
  }

  getAll(force = false) {
    // Always fetch directly to update the cache and signal (Background Refresh)
    // The initial UI is already rendered from the constructor's cache load.
    return this.api.get<Category[]>(`/categories`).pipe(
      tap((list) => {
        this.categories.set(list);
        this.storage.set('CACHE_CATEGORIES', list);
      })
    );
  }

  create(cat: Category) {
    return this.api.post<Category>(`/categories`, cat)
      .pipe(tap(newCat => this.categories.update(list => [newCat, ...list])));
  }



  update(id: string, cat: Partial<Category>) {
    return this.api.put<Category>(`/categories/${id}`, cat)
      .pipe(tap(updatedCat => {
        this.categories.update(list => list.map(c => c.id === id ? updatedCat : c));
      }));
  }

  delete(id: string) {
    return this.api.delete(`/categories/${id}`)
      .pipe(tap(() => this.categories.update(list => list.filter(c => c.id !== id))));
  }
}
