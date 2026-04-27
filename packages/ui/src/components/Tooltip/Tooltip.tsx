// Glaon Tooltip — thin wrap around the Untitled UI kit `Tooltip`
// source under `packages/ui/src/components/base/tooltip/tooltip.tsx`.
// Per CLAUDE.md's UUI Source Rule, the structural HTML/CSS,
// portal-based positioning (offset / crossOffset / placement /
// flip), and entrance / exit animations come from the kit (built on
// react-aria-components `<TooltipTrigger>` + `<Tooltip>`); Glaon's
// contribution is the wrap layer (token override via `theme.css` +
// `glaon-overrides.css`, prop API consistency, Figma
// `parameters.design` mapping in the story).
//
// `TooltipTrigger` is the icon-only button helper that the kit
// composes the Tooltip around. We re-export it too so consumers can
// reach the full kit catalogue from a single `@glaon/ui` import.

export { Tooltip, TooltipTrigger } from '../base/tooltip/tooltip';
