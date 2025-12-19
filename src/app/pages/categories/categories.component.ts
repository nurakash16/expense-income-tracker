import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { firstValueFrom } from 'rxjs';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css'],
})
export class CategoriesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(CategoryService);

  // Expose service publicly for template access
  cats = this.service;

  editingId = signal<string | null>(null);
  importing = signal(false);
  importStatus = signal('');

  form = this.fb.group({
    name: [''],
    type: ['expense'],
    budget: [0],
  });

  startAdd() {
    this.editingId.set(null);
    this.form.reset({ name: '', type: 'expense', budget: 0 });
  }

  edit(id: string) {
    this.editingId.set(id);
    const cat = this.service.categories().find((c: any) => c.id === id);
    if (cat) {
      this.form.patchValue({
        name: (cat as any).name ?? '',
        type: (cat as any).type ?? 'expense',
        budget: Number((cat as any).budget ?? 0),
      } as any);
    }
  }

  save() {
    const raw: any = this.form.value || {};
    const payload = {
      name: String(raw.name ?? '').trim(),
      type: (raw.type ?? 'expense'),
      budget: Number(raw.budget ?? 0),
    };

    if (!payload.name) {
      alert('Category name is required');
      return;
    }

    if (this.editingId()) {
      this.service.update(this.editingId()!, payload as any).subscribe({
        next: () => this.startAdd(),
        error: (err) => alert(err?.error?.message || 'Failed to update category'),
      });
    } else {
      this.service.create(payload as any).subscribe({
        next: () => this.startAdd(),
        error: (err) => {
          const msg =
            err?.error?.message ||
            err?.error?.details ||
            'Failed to create category';
          alert(msg);
        },
      });
    }
  }

  remove(id: string) {
    if (confirm('Delete category?')) {
      this.service.delete(id).subscribe({
        error: (err) => alert(err?.error?.message || 'Failed to delete'),
      });
    }
  }

  ngOnInit() {
    this.service.getAll().subscribe({
      error: (err) => console.error('Failed to load categories', err),
    });
  }

  exportCsv() {
    const rows = [['name', 'type', 'budget']];
    this.service.categories().forEach((c: any) => {
      rows.push([c.name, c.type, String(c.budget ?? 0)]);
    });
    const csv = rows.map((row) => row.map(this.escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'categories.csv';
    a.click();
  }

  async onCsv(evt: Event) {
    const input = evt.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;

    this.importing.set(true);
    this.importStatus.set('Importing...');

    try {
      const text = await file.text();
      const rows = this.parseCsv(text);
      const normalized = rows
        .map((r) => r.map((c) => (c ?? '').trim()))
        .filter((r) => r.some((v) => v));

      const header = normalized[0] || [];
      const startIndex = header.some((h) => h.toLowerCase() === 'name') ? 1 : 0;

      const existing = new Map<string, string>();
      this.service.categories().forEach((c: any) => {
        existing.set(String(c.name || '').toLowerCase(), c.id);
      });

      let created = 0;
      let updated = 0;

      for (let i = startIndex; i < normalized.length; i++) {
        const row = normalized[i];
        const name = String(row[0] || '').trim();
        if (!name) continue;
        const typeRaw = String(row[1] || 'expense').toLowerCase();
        const type = ['income', 'expense', 'both'].includes(typeRaw) ? typeRaw : 'expense';
        const budget = Number(row[2] || 0) || 0;
        const payload = { name, type, budget };
        const key = name.toLowerCase();
        const id = existing.get(key);
        if (id) {
          await firstValueFrom(this.service.update(id, payload as any));
          updated += 1;
        } else {
          await firstValueFrom(this.service.create(payload as any));
          created += 1;
        }
      }

      this.importStatus.set(`Imported: ${created} added, ${updated} updated`);
      this.service.getAll().subscribe({ error: () => {} });
    } catch (err) {
      this.importStatus.set('Import failed');
    } finally {
      this.importing.set(false);
      setTimeout(() => this.importStatus.set(''), 3000);
      if (input) input.value = '';
    }
  }

  private parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];
      if (ch === '"' && next === '"') {
        cur += '"';
        i++;
        continue;
      }
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (!inQuotes && (ch === '\n' || ch === '\r')) {
        if (ch === '\r' && next === '\n') i++;
        row.push(cur);
        rows.push(row);
        row = [];
        cur = '';
        continue;
      }
      if (!inQuotes && ch === ',') {
        row.push(cur);
        cur = '';
        continue;
      }
      cur += ch;
    }
    if (cur.length || row.length) {
      row.push(cur);
      rows.push(row);
    }
    return rows;
  }

  private escapeCsv(value: any): string {
    const s = value === null || value === undefined ? '' : String(value);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }
}
