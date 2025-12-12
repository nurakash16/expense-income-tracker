import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormsModule } from '@angular/forms';
import { TransactionService } from '../../services/transaction.service';
import { CategoryService } from '../../services/category.service';
import { Transaction } from '../../models/transaction.model';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './transactions.component.html',
})
export class TransactionsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);

  editingId = signal<string | null>(null);
  filterType = signal<'all' | 'income' | 'expense'>('all');
  searchQuery = signal<string>('');
  startDate = signal<string>('');
  endDate = signal<string>('');

  form = this.fb.group({
    type: ['expense'],
    amount: [0],
    date: [''],
    note: [''],
    paymentMethod: ['cash'],
    categoryId: ['']
  });

  cats = this.categoryService;
  csvResult: any = null;

  // Categories filtered by selected transaction type (income/expense) (+ both)
  filteredCats() {
    const t = this.form.get('type')?.value as 'income' | 'expense';
    const allowed = (type: string) => type === 'both' || type === t;
    return this.categoryService.categories().filter((c: any) => allowed(c.type));
  }

  // If current category no longer matches after switching type, clear it
  constructor() {
    const typeCtrl = this.form.get('type');
    typeCtrl?.valueChanges.subscribe((t) => {
      const current = this.form.get('categoryId')?.value as string;
      if (!current) return;
      const cat = this.categoryService.categories().find((c: any) => c.id === current);
      if (!cat || !(cat.type === 'both' || cat.type === t)) {
        this.form.get('categoryId')?.setValue('');
      }
    });
  }

  filtered = computed(() => {
    const type = this.filterType();
    const query = this.searchQuery().toLowerCase();
    const start = this.startDate();
    const end = this.endDate();
    let list = this.transactionService.transactions();

    // Filter by type
    if (type !== 'all') {
      list = list.filter((t: any) => t.type === type);
    }

    // Filter by date range
    if (start) list = list.filter((t: any) => t.date >= start);
    if (end) list = list.filter((t: any) => t.date <= end);

    // Filter by search query (note, amount, category)
    if (query) {
      list = list.filter((t: any) =>
        (t.note && t.note.toLowerCase().includes(query)) ||
        t.amount.toString().includes(query) ||
        this.categoryName(t.categoryId).toLowerCase().includes(query)
      );
    }

    return list;
  });

  categoryName(id: string) {
    return this.categoryService.categories().find((c: any) => c.id === id)?.name || 'Unknown';
  }

  startAdd() {
    this.editingId.set(null);
    this.form.reset({ type: 'expense', amount: 0, date: new Date().toISOString().split('T')[0] });
  }

  edit(tx: Transaction) {
    this.editingId.set(tx.id);
    this.form.patchValue(tx as any);
  }

  save() {
    const val = this.form.value;
    if (this.editingId()) {
      this.transactionService.update(this.editingId()!, val as any).subscribe(() => {
        this.editingId.set(null);
        this.form.reset({ type: 'expense', amount: 0, date: new Date().toISOString().split('T')[0] });
      });
    } else {
      this.transactionService.create(val as any).subscribe(() => {
        this.startAdd();
      });
    }
  }

  remove(id: string) {
    if (confirm('Are you sure?')) {
      this.transactionService.delete(id).subscribe();
    }
  }

  export() {
    this.transactionService.exportCsv().subscribe(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'transactions.csv';
      a.click();
    });
  }

  // Apply server-side filters using the enhanced API
  applyFilters() {
    const params: any = {};
    if (this.filterType() !== 'all') params.type = this.filterType();
    if (this.startDate()) params.start = this.startDate();
    if (this.endDate()) params.end = this.endDate();
    if (this.searchQuery()) params.q = this.searchQuery();
    this.transactionService.getAll(params).subscribe();
  }

  onCsv(evt: any) {
    const file: File | undefined = evt?.target?.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    // First dry-run to validate and pre-create categories (reported only)
    fetch(`${location.origin.replace(':4200',':3000')}/api/transactions/import/csv?dryRun=true`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` || '' },
      body: fd
    }).then(r => r.json()).then(res => {
      this.csvResult = res;
      // If no fatal errors, perform actual import
      if (!res.errors || res.errors.length === 0) {
        return fetch(`${location.origin.replace(':4200',':3000')}/api/transactions/import/csv`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` || '' },
          body: fd
        }).then(r => r.json());
      }
      return res;
    }).then(res => {
      this.csvResult = res;
      this.transactionService.getAll(undefined, { force: true }).subscribe();
    }).catch(() => {
      this.csvResult = { imported: 0, errors: [{ message: 'Upload failed' }] };
    });
  }

  ngOnInit() {
    // Load categories and initial transaction list once when this page mounts
    this.categoryService.getAll().subscribe({ error: () => {} });
    this.transactionService.getAll(undefined, { force: true }).subscribe({ error: () => {} });
  }
}
