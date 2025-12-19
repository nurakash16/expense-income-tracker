import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  isLoggedIn = signal<boolean>(!!(localStorage.getItem('token') || sessionStorage.getItem('token')));

  constructor(private http: HttpClient) { }

  register(email: string, password: string, displayName?: string) {
    return this.http.post(`${environment.apiUrl}/auth/register`, {
      email,
      password,
      displayName,
    });
  }

  login(email: string, password: string, remember = true) {
    return this.http
      .post<{ token: string }>(`${environment.apiUrl}/auth/login`, {
        email,
        password,
      })
      .pipe(
        tap((res) => {
          if (remember) {
            localStorage.setItem('token', res.token);
            sessionStorage.removeItem('token');
          } else {
            sessionStorage.setItem('token', res.token);
            localStorage.removeItem('token');
          }
          this.isLoggedIn.set(true);
        })
      );
  }

  logout() {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    this.isLoggedIn.set(false);
  }

  getToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }
}
