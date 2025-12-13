import { Component, OnInit, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CategoryService } from '../../services/category.service';
import { TransactionService } from '../../services/transaction.service';
import { NotificationsService } from '../../services/notifications.service';

@Component({
  standalone: true,
  imports: [RouterModule],
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private cats = inject(CategoryService);
  private tx = inject(TransactionService);
  private ns = inject(NotificationsService);

  unreadCount = 0;

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  ngOnInit() {
    // Prime caches once after auth guard passes so dashboard/transactions render instantly
    this.cats.getAll().subscribe({ error: () => { } });
    this.tx.getAll(undefined, { force: true }).subscribe({ error: () => { } });
    this.ns.unreadCount().subscribe(r => this.unreadCount = r.count);
  }
}
