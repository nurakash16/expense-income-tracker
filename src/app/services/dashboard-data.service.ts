import { Injectable } from '@angular/core';
import { ApiClientService } from './api-client.service';
import { Observable, of } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  private kpiCache = new Map<string, Observable<any>>();
  private monthlyCache = new Map<string, Observable<any>>();
  private heatmapCache = new Map<string, Observable<any>>();

  constructor(private api: ApiClientService) {}

  getKpi(params: any): Observable<any> {
    const key = JSON.stringify(params || {});
    if (this.kpiCache.has(key)) return this.kpiCache.get(key)!;

    const obs = this.api.get<any>('/kpi', { params }).pipe(
      shareReplay(1),
      catchError(err => {
        this.kpiCache.delete(key);
        throw err;
      })
    );
    this.kpiCache.set(key, obs);
    return obs;
  }

  getMonthly(month: string): Observable<any> {
    const m = month && month.endsWith('-01') ? month : `${month}-01`;
    if (this.monthlyCache.has(m)) return this.monthlyCache.get(m)!;
    const obs = this.api.get<any>(`/analytics/monthly?month=${m}`).pipe(
      shareReplay(1),
      catchError(err => {
        this.monthlyCache.delete(m);
        throw err;
      })
    );
    this.monthlyCache.set(m, obs);
    return obs;
  }

  getHeatmap(year: number | string): Observable<any> {
    const y = String(year);
    if (this.heatmapCache.has(y)) return this.heatmapCache.get(y)!;
    const obs = this.api.get<any>(`/analytics/heatmap?year=${y}`).pipe(
      shareReplay(1),
      catchError(err => {
        this.heatmapCache.delete(y);
        throw err;
      })
    );
    this.heatmapCache.set(y, obs);
    return obs;
  }
}
