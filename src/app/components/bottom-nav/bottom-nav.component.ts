import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-bottom-nav',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <nav class="fixed-bottom bg-white border-top safe-area" style="z-index: 1040;">
      <div class="container-fluid">
        <div class="row text-center py-2 gx-0">
          <div class="col">
            <a routerLink="/dashboard" routerLinkActive="active-nav" class="nav-link p-1 text-muted d-flex flex-column align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-grid mb-1" viewBox="0 0 16 16">
                 <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3z"/>
              </svg>
              <small>Home</small>
            </a>
          </div>
          <div class="col">
            <a routerLink="/transactions" routerLinkActive="active-nav" class="nav-link p-1 text-muted d-flex flex-column align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-list-ul mb-1" viewBox="0 0 16 16">
                 <path fill-rule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
              </svg>
              <small>List</small>
            </a>
          </div>
          <div class="col position-relative">
             <!-- FAB Placeholder -->
             <div class="position-absolute top-0 start-50 translate-middle" style="margin-top: -15px;">
                 <a routerLink="/transactions" [queryParams]="{action: 'new'}" class="btn btn-primary rounded-circle shadow d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16">
                      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                    </svg>
                 </a>
             </div>
          </div>
           <div class="col">
            <a routerLink="/categories" routerLinkActive="active-nav" class="nav-link p-1 text-muted d-flex flex-column align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-tags mb-1" viewBox="0 0 16 16">
                 <path d="M3 2v4.586l7 7L14.586 9l-7-7H3zM2 2a1 1 0 0 1 1-1h4.586a1 1 0 0 1 .707.293l7 7a1 1 0 0 1 0 1.414l-4.586 4.586a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 2 6.586V2z"/>
                 <path d="M5.5 5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1z"/>
              </svg>
              <small>Cats</small>
            </a>
          </div>
          <div class="col">
            <a routerLink="/insights" routerLinkActive="active-nav" class="nav-link p-1 text-muted d-flex flex-column align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-graph-up-arrow mb-1" viewBox="0 0 16 16">
                 <path fill-rule="evenodd" d="M0 0h1v15h15v1H0V0Zm10 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4.9l-3.613 4.417a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61L13.445 4H10.5a.5.5 0 0 1-.5-.5Z"/>
              </svg>
              <small>Insights</small>
            </a>
          </div>
          <div class="col">
            <a routerLink="/notifications" routerLinkActive="active-nav" class="nav-link p-1 text-muted d-flex flex-column align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-bell mb-1" viewBox="0 0 16 16">
                 <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
              </svg>
              <small>Alerts</small>
            </a>
          </div>
        </div>
      </div>
    </nav>
  `,
    styles: [`
    .nav-link { font-size: 0.75rem; color: #6c757d; }
    .nav-link.active-nav { color: #0d6efd !important; font-weight: 600; }
    .safe-area { padding-bottom: env(safe-area-inset-bottom); }
  `]
})
export class BottomNavComponent { }
