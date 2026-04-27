// Glaon Button — thin wrap around the Untitled UI kit `Button` source under
// `packages/ui/src/components/base/buttons/button.tsx`. Per CLAUDE.md's UUI
// Source Rule, the structural HTML/CSS + variant matrix come from the kit;
// Glaon's contribution is the wrap layer (token override via theme.css +
// `glaon-overrides.css`, prop API consistency, Figma `parameters.design`
// mapping in the story).
//
// We re-export the kit primitive verbatim so its full prop surface (`size`,
// `color`, `iconLeading`, `iconTrailing`, `isDisabled`, `isLoading`,
// `showTextWhileLoading`, `noTextPadding`, link variants via `href`) is
// exposed to consumers as `Button` from `@glaon/ui`.

export { Button } from '../base/buttons/button';
export type { ButtonProps } from '../base/buttons/button';
