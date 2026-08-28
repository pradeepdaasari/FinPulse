# Pulse — Agent Instructions

Personal finance + trading + health tracker. Angular 21 SPA bundled into a .NET 10 API; single deployable unit.

## Build & Run

```bash
# Backend
cd src/Pulse.Api && dotnet run --urls "http://localhost:5098"
dotnet build src/Pulse.Api/Pulse.Api.csproj

# Frontend (proxies /api → :5098)
cd src/pulse-ui && npx ng serve
npx ng build --configuration production

# EF Core migrations (project flag required — models live in Pulse.Core)
cd src/Pulse.Api
dotnet ef migrations add <Name> --project ../Pulse.Core
dotnet ef database update --project ../Pulse.Core

# Full local deployment (SPA bundled into API, served on :5000)
cd src/pulse-ui && npx ng build --configuration production
rm -rf ../Pulse.Api/wwwroot && cp -r dist/pulse-ui/browser ../Pulse.Api/wwwroot
cd ../Pulse.Api && dotnet run --urls "http://localhost:5000"
```

> Tests: `cd src/pulse-ui && npx ng test` (Vitest)

## Project Structure

```
src/
  Pulse.Api/       — ASP.NET Core host; controllers only, no business logic
    Controllers/
      AuthController.cs
      AdminController.cs
      Finance/     — loans, cards, budget, expenses, accounts, recurring, goals, simulator, strategies
      Health/      — health-metrics, blood-work, workout-plans, workout-logs
      (TradingController.cs is in Finance/ folder)
  Pulse.Core/      — models, DbContext, EF migrations, domain services
    Data/PulseDbContext.cs
    Models/        — Finance/, Trading/, Health/, ApplicationUser.cs
    Services/      — BudgetService, PayoffStrategyService, SnapshotService, etc.
    Migrations/
  pulse-ui/src/app/
    core/          — guards, services, models, interceptors
    features/      — one folder per route/domain
    shared/        — reusable components
```

## Architecture Rules

- **No repository pattern** — controllers use `PulseDbContext` directly.
- **Multi-tenant** — every entity has a `UserId` column; always filter by the authenticated user's ID in controllers.
- **Auth** — ASP.NET Core Identity with HttpOnly cookie (SameSite=Strict, 14-day sliding). NOT JWT. Key endpoints: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `PUT /api/auth/timezone`.
- **Timestamps** — `SaveChanges` override in `PulseDbContext` auto-sets `CreatedAt`/`UpdatedAt`; don't set them manually.
- **API routes** — `[Route("api/{domain}")]` pattern (e.g. `api/trading`, `api/loans`).
- **Database** — Azure SQL Server + EF Core. Auto-migrates on startup with retry logic. Use HTTP (not HTTPS) for local dev.
- **Decimal precision** — always specify `HasPrecision(18, 2)` for money columns in `OnModelCreating`.

## Frontend Conventions

- **Angular 21, zoneless** — use `provideZonelessChangeDetection()`, signals (`signal`, `computed`), `inject()` pattern. No `ngOnInit` subscription patterns.
- **Standalone components only** — no NgModules.
- **All styles are inline** in `.ts` files (SCSS syntax). No separate `.html` or `.css` files.
- **Lazy loading** — all routes use `loadComponent()` in `app.routes.ts`.
- **Services** — `@Injectable({ providedIn: 'root' })`, one per domain, `inject(HttpClient)`.
- **Models** — TypeScript interfaces in `core/models/`, one file per domain.
- **State** — Angular signals only. No NgRx.
- **CSS variables** — use `var(--color-surface)`, `var(--color-primary)`, `var(--color-text-muted)`, `var(--shadow-sm)`, `var(--radius-sm)`, `var(--gradient-primary)`, `var(--transition-fast)`. Defined in `styles.scss`.
- **Responsive** — `.desktop-only` table + `.mobile-cards` at 599px breakpoint.
- **Layout** — `.header-row` (actions right-aligned), `.empty-state` + `.empty-icon-wrap` for empty views.
- **No hardcoded data** — categories, metric types, tags — all fetched from API.
- **Component style budget** — warning at 8 KB, error at 16 KB (enforced in `angular.json`).
- **Timezone** — stored as `PreferredTimezone` on `ApplicationUser`; frontend reads from `/api/auth/me` and caches in `localStorage` as `pulse_timezone`.

## Trading Module

Philosophy: discipline over strategy, process over P&L. UI should be encouraging/mentor-like. Domains: premarket → checklist → journal → review → weekly-summary. Setups and rules are user-configurable.

## Key Pitfalls

- Dev proxy (`proxy.conf.json`) targets `http://localhost:5098`; bundled production deployment uses port 5000.
- `dotnet ef` commands must be run from `src/Pulse.Api/` with `--project ../Pulse.Core` because migrations are in `Pulse.Core`.
- Do not push to git on every change — deploy directly to Azure when needed.
- Azure deployment: publish → zip → `az webapp deploy`.

See [CLAUDE.md](CLAUDE.md) for full Azure deployment commands.
