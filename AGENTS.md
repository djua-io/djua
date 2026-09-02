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
- Run `npm run build` before handing off.
- At the end of every task, report an exact local test command and the route to open.
