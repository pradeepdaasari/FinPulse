import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, HttpInterceptorFn } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideServiceWorker } from '@angular/service-worker';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideNativeDateAdapter } from '@angular/material/core';
import { DATE_PIPE_DEFAULT_OPTIONS } from '@angular/common';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

import { routes } from './app.routes';

// Angular's DatePipe only accepts fixed UTC offsets (e.g. "-0500"), not IANA names like "America/Chicago"
function ianaToFixedOffset(tz: string): string | null {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' }).formatToParts(new Date());
    const raw = parts.find(p => p.type === 'timeZoneName')?.value ?? '';
    const match = raw.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
    if (!match) return null;
    const [, sign, hh, mm = '00'] = match;
    return `${sign}${hh.padStart(2, '0')}${mm}`;
  } catch {
    return null;
  }
}

const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  return next(req).pipe(
    tap({
      error: (err) => {
        if (err.status === 401 && !req.url.includes('/api/auth/')) {
          router.navigate(['/login']);
        }
      }
    })
  );
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    provideNativeDateAdapter(),
    provideCharts(withDefaultRegisterables()),
    { provide: DATE_PIPE_DEFAULT_OPTIONS, useFactory: () => {
      const tz = localStorage.getItem('pulse_timezone');
      const offset = tz ? ianaToFixedOffset(tz) : null;
      return offset ? { timezone: offset } : {};
    }},
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ]
};
