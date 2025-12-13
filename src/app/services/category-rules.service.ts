import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type CategoryRule = {
    id: string;
    categoryId: string;
    pattern: string;
    isRegex: boolean;
    priority: number;
    createdAt: string;
};

@Injectable({ providedIn: 'root' })
export class CategoryRulesService {
    constructor(private http: HttpClient) { }

    list(): Observable<{ items: CategoryRule[] }> {
        return this.http.get<{ items: CategoryRule[] }>(`/api/category-rules`);
    }

    create(body: { categoryId: string; pattern: string; isRegex?: boolean; priority?: number }) {
        return this.http.post(`/api/category-rules`, body);
    }

    delete(id: string) {
        return this.http.delete(`/api/category-rules/${id}`);
    }
}
