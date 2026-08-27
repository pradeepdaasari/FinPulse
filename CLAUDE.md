# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

### Frontend (Angular 21, zoneless)
```bash
cd src/pulse-ui
npm install                              # first time only
npx ng build --configuration production  # production build → dist/pulse-ui/browser/
npx ng serve                             # dev server on :4200, proxies /api → :5098
npx ng test                              # runs Vitest
```

### Backend (.NET 10)
```bash
cd src/Pulse.Api
dotnet run --urls "http://localhost:5098"   # local dev (matches proxy.conf.json target)
dotnet build                               # compile only
dotnet publish -c Release -o ../../publish  # release build
```

### Full local deployment (SPA bundled into API)
```bash
cd src/pulse-ui && npx ng build --configuration production
rm -rf ../Pulse.Api/wwwroot && cp -r dist/pulse-ui/browser ../Pulse.Api/wwwroot
cd ../Pulse.Api && dotnet run --urls "http://localhost:5000"
```

### Azure deployment
```bash
cd src/Pulse.Api
dotnet publish -c Release -o ../../publish
cd ../../publish && zip -r ../deploy.zip .
az webapp deploy --resource-group finpulse-rg --name finpulse-pd --src-path ../deploy.zip --type zip
```

### EF Core migrations
```bash
cd src/Pulse.Api
dotnet ef migrations add <Name> --project ../Pulse.Core
dotnet ef database update --project ../Pulse.Core
```

## Architecture

### Deployment model
Angular SPA is compiled into `Pulse.Api/wwwroot/`. The API serves it via `MapFallbackToFile("index.html")` — single deployable unit. No separate frontend hosting.

### Backend (src/Pulse.Api + src/Pulse.Core)
- **Pulse.Api**: ASP.NET Core host with controllers only (no business logic). Controllers in `Controllers/Finance/` and `Controllers/Health/` plus top-level `AuthController` and `AdminController`.
- **Pulse.Core**: Models (`Models/Finance/`, `Models/Trading/`, `Models/Health/`), EF DbContext (`Data/PulseDbContext`), migrations, and domain services (`Services/`).
- **No repository pattern** — controllers use `PulseDbContext` directly.
- **Multi-tenant**: All entities have `UserId` column. Filter by authenticated user in controllers.
- **Auth**: ASP.NET Core Identity with cookie auth (HttpOnly, SameSite=Strict, 14-day sliding). NOT JWT. Endpoints: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- **Database**: Azure SQL Server with EF Core. Auto-migrates on startup with retry logic.
- **API routes**: `[Route("api/{domain}")]` pattern — e.g. `api/trading`, `api/loans`, `api/health-metrics`.
- **Automatic timestamps**: `SaveChanges` override sets `CreatedAt`/`UpdatedAt` on tracked entities.

### Frontend (src/pulse-ui/)
- **Angular 21** with zoneless change detection (`provideZonelessChangeDetection()`), signals, standalone components, `inject()` pattern.
- **All component styles are inline** in `.ts` files (no separate `.html`/`.css` files). SCSS syntax.
- **Routing**: Lazy `loadComponent()` for all routes in `app.routes.ts`. Every route except `/login` guarded by `authGuard`.
- **Services**: `@Injectable({ providedIn: 'root' })`, one per domain, using `inject(HttpClient)`. Base URL from `environment.apiUrl` (defaults to `/api`).
- **Models**: TypeScript interfaces in `core/models/` — one file per domain.
- **State**: Angular signals (`signal`, `computed`). No NgRx/store.
- **UI library**: Angular Material + CDK.
- **HTTP interceptor**: Auto-redirects to `/login` on 401.
- **PWA**: Service worker (`ngsw-config.json`) with freshness-first API caching. Installable on iOS/Android.
- **Theme**: Light/dark/system via `ThemeService`. Dark mode adds `.dark` class to root element.
- **Navigation**: `nav-shell.component.ts` — collapsible sidebar sections (Finance, Trading, Health) + bottom tab bar on mobile.

### Key patterns for UI components
- **Responsive**: `.desktop-only` table + `.mobile-cards` at 599px breakpoint.
- **CSS variables**: `var(--color-surface)`, `var(--color-primary)`, `var(--color-text-muted)`, `var(--shadow-sm)`, `var(--radius-sm)`, `var(--gradient-primary)`, `var(--transition-fast)`, etc. Defined in `styles.scss`.
- **Layout conventions**: `.header-row` (button right-aligned), `.empty-state` + `.empty-icon-wrap` for empty views.
- **Data-driven**: No hardcoded values. Categories, metric types, tag types — all fetched from API.
- **Mobile touch targets**: Minimum 44px buttons/tap areas. Base font 16px on mobile.

### Domain structure
- **Finance**: loans, credit-cards, bank-accounts, budget, expenses (daily transactions), categories, payments, recurring, goals, simulator, strategies
- **Trading**: premarket (daily ritual), setups (configurable checklists), checklist (pre-trade gate), journal (trade log), review (daily grading), playbook (rules/wisdom), weekly-summary (analysis)
- **Health & Fitness**: health-metrics (vitals), blood-work (lab reports), workout-plans, workout-logs, progress/PRs

## Important Constraints

- Do not hardcode data values — all must be data-driven from the API.
- Use HTTP (not HTTPS) for local dev — self-signed certs cause browser rejection.
- Dev proxy (`proxy.conf.json`) targets `http://localhost:5098`; bundled deployment uses port 5000.
- Do not push to git on every change — deploy directly to Azure when needed.
- Component styles budget: warning at 8KB, error at 16KB (in `angular.json`).
- Trading module philosophy: discipline over strategy, process over P&L. UI should be encouraging/mentor-like.
