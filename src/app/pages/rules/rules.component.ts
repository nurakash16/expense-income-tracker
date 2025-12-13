import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryRulesService, CategoryRule } from '../../services/category-rules.service';
import { CategoryService } from '../../services/category.service';

@Component({
    selector: 'app-rules',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="container py-3">
      <h3>Smart Categorization Rules</h3>

      <div class="card my-3">
        <div class="card-body">
          <div class="row g-2">
            <div class="col-12 col-md-4">
              <label class="form-label">Keyword / Pattern</label>
              <input class="form-control" [(ngModel)]="pattern" placeholder="uber, netflix, walmart" />
            </div>

            <div class="col-12 col-md-4">
              <label class="form-label">Category</label>
              <select class="form-select" [(ngModel)]="categoryId">
                <option [ngValue]="''">Select...</option>
                <option *ngFor="let c of categories" [ngValue]="c.id">{{ c.name }}</option>
              </select>
            </div>

            <div class="col-6 col-md-2">
              <label class="form-label">Priority</label>
              <input class="form-control" type="number" [(ngModel)]="priority" />
            </div>

            <div class="col-6 col-md-2 d-flex align-items-end">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" [(ngModel)]="isRegex" id="isRegex"/>
                <label class="form-check-label" for="isRegex">Regex</label>
              </div>
            </div>
          </div>

          <button class="btn btn-primary mt-3" (click)="add()">Add Rule</button>
        </div>
      </div>

      <div *ngFor="let r of rules" class="card mb-2">
        <div class="card-body d-flex justify-content-between align-items-center">
          <div>
            <div class="fw-bold">{{ r.pattern }} <span class="badge bg-secondary" *ngIf="r.isRegex">regex</span></div>
            <div class="text-muted small">priority {{ r.priority }} · category {{ r.categoryId }}</div>
          </div>
          <button class="btn btn-sm btn-outline-danger" (click)="remove(r.id)">Delete</button>
        </div>
      </div>
    </div>
  `
})
export class RulesComponent {
    rules: CategoryRule[] = [];
    categories: any[] = [];

    pattern = '';
    categoryId = '';
    priority = 100;
    isRegex = false;

    constructor(
        private rulesApi: CategoryRulesService,
        private catApi: CategoryService
    ) {
        this.refresh();
        this.catApi.getAll().subscribe((r: any) => this.categories = r);
    }

    refresh() {
        this.rulesApi.list().subscribe((r) => this.rules = r.items);
    }

    add() {
        if (!this.pattern || !this.categoryId) return;
        this.rulesApi.create({
            pattern: this.pattern,
            categoryId: this.categoryId,
            priority: this.priority,
            isRegex: this.isRegex
        }).subscribe(() => {
            this.pattern = '';
            this.isRegex = false;
            this.priority = 100;
            this.refresh();
        });
    }

    remove(id: string) {
        this.rulesApi.delete(id).subscribe(() => this.refresh());
    }
}
