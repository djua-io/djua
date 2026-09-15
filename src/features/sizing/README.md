# Sizing

## Purpose

This feature guides a sales representative from a customer and site through appliance collection, a solar recommendation, payment configuration, and quote generation.

## Current route flow

```text
/dimensionnements/nouveau
  -> /dimensionnements/:id/logement or /dimensionnements/:id/site
  -> /dimensionnements/:id/appareils
  -> /dimensionnements/:id/recommandation
  -> /dimensionnements/:id/paiement
```

## Migration target

Move sizing route components and sizing-specific state here. Keep calculations in `src/domain/sizing.ts` until they are split into small deterministic modules with tests. Do not place localStorage, React state, or API requests in the domain module.
