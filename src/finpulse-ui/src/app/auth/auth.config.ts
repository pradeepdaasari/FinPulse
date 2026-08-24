import { MsalGuardConfiguration, MsalInterceptorConfiguration } from '@azure/msal-angular';
import { BrowserCacheLocation, Configuration, InteractionType, LogLevel } from '@azure/msal-browser';

// ============================================================
// MSAL Configuration
// Replace the placeholder values below with your Azure AD app registration details:
//   - clientId: Your application (client) ID from Azure Portal
//   - authority: Your tenant's authority URL
//   - redirectUri: Must match a redirect URI registered in Azure Portal
// ============================================================

export const msalConfig: Configuration = {
  auth: {
    clientId: '00000000-0000-0000-0000-000000000000', // TODO: Replace with your Azure AD client ID
    authority: 'https://login.microsoftonline.com/common', // TODO: Replace 'common' with your tenant ID
    redirectUri: 'http://localhost:4200',
    postLogoutRedirectUri: 'http://localhost:4200'
  },
  cache: {
    cacheLocation: BrowserCacheLocation.LocalStorage
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Info,
      piiLoggingEnabled: false
    }
  }
};

// Protected resources that require tokens
export const protectedResourceMap: Map<string, string[]> = new Map([
  ['/api/*', ['api://00000000-0000-0000-0000-000000000000/access_as_user']] // TODO: Replace with your API scope
]);

export const msalGuardConfig: MsalGuardConfiguration = {
  interactionType: InteractionType.Redirect,
  authRequest: {
    scopes: ['user.read']
  }
};

export const msalInterceptorConfig: MsalInterceptorConfiguration = {
  interactionType: InteractionType.Redirect,
  protectedResourceMap
};
