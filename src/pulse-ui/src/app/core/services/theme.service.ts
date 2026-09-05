import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  constructor() {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    localStorage.setItem('pulse_theme', 'light');
  }

  isDark(): boolean {
    return false;
  }
}
