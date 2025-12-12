import { Injectable } from '@angular/core';
import { ApiClientService } from './api-client.service';
import { of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  constructor(private api: ApiClientService) {}
  private heatmapCache = new Map<number, any>();
  private waterfallCache = new Map<string, any>();
  private rollupCache = new Map<string, any>();
  kpis(params?: any) {
    return this.api.get<any>('/kpi', { params });
  }
  heatmap(year: number) {
    if (this.heatmapCache.has(year)) return of(this.heatmapCache.get(year));
    return this.api.get<any>('/analytics/heatmap', { params: { year } });
  }
  waterfall(params?: { start?: string; end?: string }) {
    const key = JSON.stringify(params || {});
    if (this.waterfallCache.has(key)) return of(this.waterfallCache.get(key));
    return this.api.get<any>('/analytics/waterfall', { params });
  }
  rollups(params?: { start?: string; end?: string }) {
    const key = JSON.stringify(params || {});
    if (this.rollupCache.has(key)) return of(this.rollupCache.get(key));
    return this.api.get<any>('/analytics/rollups', { params });
  }
}
