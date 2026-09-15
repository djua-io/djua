# Djua UI implementation guide

## Visual baseline
- Treat the supplied Djua and Orange Énergie mockups as the source of truth.
- Desktop canvas: persistent 236px left rail, 68px top bar, broad main work area and a 340px contextual right rail.
- Use white cards on `#FCFCFC`, `#E8E8E8` hairline borders, 10–12px corners and very restrained shadows.
- Primary orange is `#FF5A00`; reserve it for selected state, key metrics and primary CTAs.
- Use Lucide React icons for interface symbols. Do not introduce emoji in production-facing UI.
- Spacing rhythm: 8px base, card padding 18–22px, column gaps 24px, page padding 28px.
- Generated customer quote documents use **Orange Énergie** only. Internal app uses Djúa.

## Working checks
- Keep the demonstrated end-to-end flow working after every visual change.
- Run `npm run quality` before handing off.
- At the end of every task, report an exact local test command and the route to open.

## Architecture
- `src/app/` composes the application shell, routing, and providers.
- `src/features/` owns user-facing business capabilities.
- `src/domain/` contains pure business rules: never import React, browser storage, fetch, routes, or CSS there.
- `src/shared/` is generic UI and infrastructure only; it must not contain Djua-specific business rules.
- Do not import a feature's internals from another feature. Add a deliberate public API when cross-feature reuse is needed.
- `src/app/legacy/DjuaApp.tsx` is migration-only. Do not add new product work there; move one feature vertically while preserving its route.
- Read `docs/architecture.md` and `docs/domain-glossary.md` before naming or moving domain concepts.
