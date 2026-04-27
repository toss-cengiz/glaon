// Glaon Spinner — thin wrap around the Untitled UI kit `LoadingIndicator`
// source under `packages/ui/src/components/application/loading-indicator/
// loading-indicator.tsx`. Per CLAUDE.md's UUI Source Rule, the structural
// SVG + size matrix come from the kit; Glaon's contribution is the wrap
// layer (token override via `theme.css` + `glaon-overrides.css`, prop API
// consistency, Figma `parameters.design` mapping in the story).
//
// The base `progress-indicators` source has no spinner-style indicator;
// the closest UUI counterpart is `LoadingIndicator` (lives under the
// application tier in the kit). We surface it as `Spinner` from
// `@glaon/ui` to keep our barrel naming consistent with the Phase 1 plan
// (P1: Badge + Spinner + ProgressBar).

export { LoadingIndicator as Spinner } from '../application/loading-indicator/loading-indicator';
