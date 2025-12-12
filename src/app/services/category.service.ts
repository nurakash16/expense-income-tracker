import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ApiClientService } from './api-client.service';
import { Category } from '../models/category.model';
import { tap, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  categories = signal<Category[]>([]);

  constructor(private http: HttpClient, private api: ApiClientService) {}

  getAll(force = false) {
    if (!force && this.categories().length) {
      return of(this.categories());
    }
    return this.api.get<Category[]>(`/categories`).pipe(
      tap((list) => this.categories.set(list))
    );
  }

  create(cat: Category) {
    return this.api.post<Category>(`/categories`, cat)
      .pipe(tap(newCat => this.categories.update(list => [newCat, ...list])));
  }

  delete(id: string) {
    return this.api.delete(`/categories/${id}`)
      .pipe(tap(() => this.categories.update(list => list.filter(c => c.id !== id))));
  }
}
