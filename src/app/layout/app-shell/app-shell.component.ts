import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

type NavItem = { label: string; icon: string; route: string };

@Component({
  standalone: true,
  selector: 'app-shell',
  imports: [CommonModule, RouterModule],
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.css'],
})
export class AppShellComponent {
  sidebarOpen = signal(false);
  activeRoute = signal('/overview');

  nav: NavItem[] = [
    { label: 'Overview', icon: 'home', route: '/overview' },
    { label: 'Transactions', icon: 'list', route: '/transactions' },
    { label: 'Add', icon: 'add', route: '/add' },
    { label: 'Budgets', icon: 'budget', route: '/budgets' },
    { label: 'Reports', icon: 'report', route: '/reports' },
    { label: 'Settings', icon: 'settings', route: '/settings' },
  ];

  constructor(private router: Router) {
    this.activeRoute.set(this.router.url || '/overview');
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.activeRoute.set(e.urlAfterRedirects || '/overview');
      this.sidebarOpen.set(false);
    });
  }

  toggleSidebar() {
    this.sidebarOpen.set(!this.sidebarOpen());
  }
}
