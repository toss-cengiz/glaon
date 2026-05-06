// Glaon flag-icon registry — Phase C.2 (#366).
//
// Backed by the `flag-icons` npm package (Option B from the issue's
// architectural decision). The package's CSS + SVG sprites are
// served from the same origin as the bundle, so Glaon's restrictive
// CSP (`default-src 'self'`) stays intact.

export { Flag } from './Flag';
export { countryCatalog } from './countries';
export type { FlagCatalogEntry, FlagCountry, FlagIconProps, FlagRegion } from './types';
