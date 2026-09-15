# Djua frontend architecture

Djua is being migrated incrementally from a single-file demo into a feature-first frontend. Existing behaviour takes priority over directory purity: each move must preserve the currently demonstrated flow.

## Dependency direction

```text
app -> features -> domain + shared
```

- `app/` composes routing, providers, and the global shell.
- `features/` owns user-facing capabilities and their route components.
- `domain/` holds deterministic business rules and must not import React, browser APIs, HTTP clients, or CSS.
- `shared/` contains generic UI, infrastructure, styles, and helpers. It must not contain Djua-specific rules.

Features must not import another feature's internal files. Expose an intentional public API from a feature's `index.ts` only when another feature genuinely needs it.

## Transitional boundary

`src/app/legacy/DjuaApp.tsx` contains the pre-refactor implementation. It is intentionally isolated behind `src/app/App.tsx`; new work must not be added there when a feature folder is available. Move routes and their direct dependencies one vertical feature at a time, deleting the legacy code only after its replacement preserves the route.

## State and data

- Keep transient UI state in components.
- Keep server data behind feature API modules; adopt generated API contracts when the FastAPI OpenAPI schema is available.
- Restrict application-wide state to identity, shop, permissions, and preferences.
- Treat the current localStorage store as demo infrastructure, not a domain model or future API boundary.
