import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';

// TODO: Uncomment MSAL providers when Entra ID app registrations are configured
// import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
// import {
//   MSAL_INSTANCE, MSAL_GUARD_CONFIG, MSAL_INTERCEPTOR_CONFIG,
//   MsalService, MsalGuard, MsalBroadcastService, MsalInterceptor
// } from '@azure/msal-angular';
// import { PublicClientApplication } from '@azure/msal-browser';
// import { msalConfig, msalGuardConfig, msalInterceptorConfig } from './auth/auth.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
    provideCharts(withDefaultRegisterables()),
    // TODO: Uncomment when Entra ID is configured
    // { provide: MSAL_INSTANCE, useFactory: () => new PublicClientApplication(msalConfig) },
    // { provide: MSAL_GUARD_CONFIG, useValue: msalGuardConfig },
    // { provide: MSAL_INTERCEPTOR_CONFIG, useValue: msalInterceptorConfig },
    // { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },
    // MsalService, MsalGuard, MsalBroadcastService
  ]
};
