import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

function join(base: string, path: string): string {
  if (base.endsWith('/')) base = base.slice(0, -1);
  if (!path.startsWith('/')) path = '/' + path;
  return base + path;
}

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private primaryBase = environment.apiUrl; // could be '/api' or absolute
  private fallbackBase = environment.apiUrl.startsWith('http') ? '/api' : 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  get<T>(path: string, options: { params?: Record<string, any> } = {}): Observable<T> {
    const params = options.params ? new HttpParams({ fromObject: options.params }) : undefined;
    return this.http.get<T>(join(this.primaryBase, path), { params }).pipe(
      catchError((err) => this.retryIfProxyOrNetwork<T>('GET', path, undefined, params, err))
    );
  }

  post<T>(path: string, body: any, options: { params?: Record<string, any> } = {}): Observable<T> {
    const params = options.params ? new HttpParams({ fromObject: options.params }) : undefined;
    return this.http.post<T>(join(this.primaryBase, path), body, { params }).pipe(
      catchError((err) => this.retryIfProxyOrNetwork<T>('POST', path, body, params, err))
    );
  }

  put<T>(path: string, body: any, options: { params?: Record<string, any> } = {}): Observable<T> {
    const params = options.params ? new HttpParams({ fromObject: options.params }) : undefined;
    return this.http.put<T>(join(this.primaryBase, path), body, { params }).pipe(
      catchError((err) => this.retryIfProxyOrNetwork<T>('PUT', path, body, params, err))
    );
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(join(this.primaryBase, path)).pipe(
      catchError((err) => this.retryIfProxyOrNetwork<T>('DELETE', path, undefined, undefined, err))
    );
  }

  getBlob(path: string): Observable<Blob> {
    return this.http.get(join(this.primaryBase, path), { responseType: 'blob' }).pipe(
      catchError((err) => this.retryIfProxyOrNetwork<Blob>('GET_BLOB', path, undefined, undefined, err, true))
    );
  }

  private retryIfProxyOrNetwork<T>(
    method: string,
    path: string,
    body?: any,
    params?: HttpParams,
    err?: HttpErrorResponse,
    blob = false
  ): Observable<T> {
    const isNetwork = !err || err.status === 0;
    const isDevServerText = typeof err?.error === 'string' && err.error.startsWith('Cannot ');
    if (!isNetwork && !isDevServerText) return throwError(() => err);

    const url = join(this.fallbackBase, path);
    switch (method) {
      case 'GET':
        return this.http.get<T>(url, { params });
      case 'GET_BLOB':
        return this.http.get(url, { responseType: 'blob' as const }) as any;
      case 'POST':
        return this.http.post<T>(url, body, { params });
      case 'PUT':
        return this.http.put<T>(url, body, { params });
      case 'DELETE':
        return this.http.delete<T>(url);
      default:
        return throwError(() => err);
    }
  }
}

