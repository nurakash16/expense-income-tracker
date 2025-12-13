import { Injectable, Injector, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private primaryBase = environment.apiUrl;

  // Global state signals
  public isOffline = signal<boolean>(!navigator.onLine);
  public isServerUnreachable = signal<boolean>(false);

  constructor(private http: HttpClient, private injector: Injector) {
    window.addEventListener('online', () => this.isOffline.set(false));
    window.addEventListener('offline', () => this.isOffline.set(true));
  }

  private getUrl(path: string): string {
    const base = this.primaryBase.endsWith('/') ? this.primaryBase.slice(0, -1) : this.primaryBase;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
  }

  get<T>(path: string, options: { params?: Record<string, any> } = {}): Observable<T> {
    return this.request<T>('GET', path, undefined, options);
  }

  post<T>(path: string, body: any, options: { params?: Record<string, any> } = {}): Observable<T> {
    return this.request<T>('POST', path, body, options);
  }

  patch<T>(path: string, body: any, options: { params?: Record<string, any> } = {}): Observable<T> {
    return this.request<T>('PATCH', path, body, options);
  }

  put<T>(path: string, body: any, options: { params?: Record<string, any> } = {}): Observable<T> {
    return this.request<T>('PUT', path, body, options);
  }

  delete<T>(path: string, options: { params?: Record<string, any> } = {}): Observable<T> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  getBlob(path: string, options: { params?: Record<string, any> } = {}): Observable<Blob> {
    const url = this.getUrl(path);
    let httpParams: HttpParams | undefined;
    if (options.params) {
      const cleanParams: Record<string, any> = {};
      Object.keys(options.params).forEach(key => {
        const val = options.params![key];
        if (val !== undefined && val !== null && val !== 'undefined' && val !== 'null' && val !== '') {
          cleanParams[key] = val;
        }
      });
      httpParams = new HttpParams({ fromObject: cleanParams });
    }

    return this.http.get(url, { responseType: 'blob', params: httpParams }).pipe(
      // Standardized retry logic could be applied here too if valuable, 
      // but usually downloads are less retry-friendly or handled differently.
      // We'll keep it simple or align with request().
      // Let's just return the raw observable for now or wrap it if needed.
      retry(2), // simple retry
      catchError(err => this.categorizeError(err))
    );
  }

  private request<T>(method: string, path: string, body?: any, options: { params?: Record<string, any> } = {}): Observable<T> {
    const url = this.getUrl(path);

    let httpParams: HttpParams | undefined;
    if (options.params) {
      // Filter out undefined/null values
      const cleanParams: Record<string, any> = {};
      Object.keys(options.params).forEach(key => {
        const val = options.params![key];
        if (val !== undefined && val !== null && val !== 'undefined' && val !== 'null' && val !== '') {
          cleanParams[key] = val;
        }
      });
      httpParams = new HttpParams({ fromObject: cleanParams });
    }

    return this.http.request<T>(method, url, {
      body,
      params: httpParams,
    }).pipe(
      // Standardized retry logic
      retry({
        count: 3,
        delay: (error, retryCount) => {
          // Only retry on Network Error (0) or Server Overload (502, 503, 504)
          if (error.status === 0 || error.status === 502 || error.status === 503 || error.status === 504) {
            // Exponential backoff: 500ms, 1000ms, 2000ms
            return timer(500 * Math.pow(2, retryCount - 1));
          }
          return throwError(() => error);
        }
      }),
      tap({
        error: (err) => this.handleGlobalError(err)
      }),
      catchError((err) => this.categorizeError(err))
    );
  }

  private handleGlobalError(error: HttpErrorResponse): void {
    // Handle 401 Unauthorized - Lazy load logic to avoid circular deps if any
    if (error.status === 401) {
      // Lazy inject AuthService to update state
      const authService = this.injector.get(AuthService);
      authService.logout(); // This should clear the token and update isLoggedIn signal
      const router = this.injector.get(Router);
      router.navigate(['/login']);
    }

    // Update offline/server status signals
    if (error.status === 0) {
      this.isOffline.set(true);
    }
    if (error.status >= 500) {
      this.isServerUnreachable.set(true);
    }
  }

  private categorizeError(error: HttpErrorResponse): Observable<never> {
    // Map to a standard error format if needed, or just rethrow
    // This is where you'd normalize error messages for the UI
    let errorMessage = 'An unexpected error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Network error: ${error.error.message}`;
    } else if (error.status === 0) {
      errorMessage = 'No internet connection or server unreachable';
    } else {
      // Server-side error
      errorMessage = error.error?.message || `Server returned code ${error.status}`;
    }

    // You can attach the friendly message to the error object or return a new structure
    // For now, we attach it to the error object for consumers
    (error as any).friendlyMessage = errorMessage;

    return throwError(() => error);
  }
}

