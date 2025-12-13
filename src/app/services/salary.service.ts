import { Injectable, signal } from '@angular/core';
import { ApiClientService } from './api-client.service';
import { tap } from 'rxjs';

export interface MonthlySalary {
    id: string;
    month: string;
    amount: number;
}

@Injectable({ providedIn: 'root' })
export class SalaryService {
    currentSalary = signal<number>(0);

    constructor(private api: ApiClientService) { }

    getSalary(month: string) {
        return this.api.get<{ amount: number, isInherited: boolean, sourceMonth: string }>(`/salary?month=${month}`).pipe(
            tap(res => this.currentSalary.set(res.amount))
        );
    }

    upsertSalary(month: string, amount: number) {
        return this.api.post<MonthlySalary>(`/salary`, { month, amount }).pipe(
            tap(res => this.currentSalary.set(Number(res.amount)))
        );
    }
}
