// Glaon Checkbox — thin wrap around the Untitled UI kit `Checkbox`
// source under `packages/ui/src/components/base/checkbox/checkbox.tsx`.
// Per CLAUDE.md's UUI Source Rule, the structural HTML/CSS, focus /
// selected / indeterminate / disabled state matrix come from the kit
// (which is built on react-aria-components `<Checkbox>`); Glaon's
// contribution is the wrap layer (token override via `theme.css` +
// `glaon-overrides.css`, prop API consistency, Figma `parameters.design`
// mapping in the story).
//
// `CheckboxBase` is the unwrapped check-icon primitive; surface it for
// consumers that want to compose their own label scaffolding.

export { Checkbox, CheckboxBase } from '../base/checkbox/checkbox';
