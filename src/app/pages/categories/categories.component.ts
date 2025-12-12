import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { CategoryService } from '../../services/category.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categories.component.html',
})
export class CategoriesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(CategoryService);

  // Expose service publicly for template access
  cats = this.service;

  editingId = signal<string | null>(null);

  form = this.fb.group({
    name: [''],
    type: ['expense'],
  });

  startAdd() {
    this.editingId.set(null);
    this.form.reset({ type: 'expense' });
  }

  edit(id: string) {
    this.editingId.set(id);
    const cat = this.service.categories().find((c: any) => c.id === id);
    if (cat) {
      this.form.patchValue(cat as any);
    }
  }

  save() {
    if (this.editingId()) {
      // Update logic
    } else {
      this.service.create(this.form.value as any).subscribe(() => {
        this.startAdd(); // reset
      });
    }
  }

  remove(id: string) {
    if (confirm('Delete category?')) {
      this.service.delete(id).subscribe();
    }
  }

  ngOnInit() {
    // Ensure categories are loaded after successful login navigation
    this.service.getAll().subscribe({
      error: (err) => console.error('Failed to load categories', err)
    });
  }
}
