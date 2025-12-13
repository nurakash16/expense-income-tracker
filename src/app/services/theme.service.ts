import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    theme = signal<Theme>('light');

    constructor() {
        this.init();

        // Auto-save and apply side effects when signal changes
        effect(() => {
            const t = this.theme();
            localStorage.setItem('theme', t);
            document.documentElement.setAttribute('data-bs-theme', t);
        });
    }

    private init() {
        const saved = localStorage.getItem('theme') as Theme;
        if (saved) {
            this.theme.set(saved);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.theme.set('dark');
        }
    }

    toggle() {
        this.theme.update(current => current === 'light' ? 'dark' : 'light');
    }
}
