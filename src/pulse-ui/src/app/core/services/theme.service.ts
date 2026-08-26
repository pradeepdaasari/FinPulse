import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  theme = signal<ThemeMode>(this.getStoredTheme());

  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  constructor() {
    effect(() => {
      const mode = this.theme();
      localStorage.setItem('pulse_theme', mode);
      this.applyTheme(mode);
    });

    this.mediaQuery.addEventListener('change', () => {
      if (this.theme() === 'system') {
        this.applyTheme('system');
      }
    });
  }

  toggle(): void {
    const modes: ThemeMode[] = ['light', 'dark', 'system'];
    const current = modes.indexOf(this.theme());
    this.theme.set(modes[(current + 1) % modes.length]);
  }

  isDark(): boolean {
    const mode = this.theme();
    if (mode === 'system') return this.mediaQuery.matches;
    return mode === 'dark';
  }

  private getStoredTheme(): ThemeMode {
    const stored = localStorage.getItem('pulse_theme');
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    return 'system';
  }

  private applyTheme(mode: ThemeMode): void {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    if (mode === 'system') {
      if (this.mediaQuery.matches) {
        root.classList.add('dark');
      }
    } else {
      root.classList.add(mode);
    }
  }
}
