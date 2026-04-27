// Glaon Avatar — thin wrap around the Untitled UI kit `Avatar` source
// under `packages/ui/src/components/base/avatar/avatar.tsx`. Per
// CLAUDE.md's UUI Source Rule, the structural HTML/CSS + size matrix
// come from the kit; Glaon's contribution is the wrap layer (token
// override via `theme.css` + `glaon-overrides.css`, prop API
// consistency, Figma `parameters.design` mapping in the story).
//
// The kit's `Avatar` is parameterized (`size`, `src`, `alt`, `initials`,
// `status`, `verified`, `count`, `badge`, `border`, `placeholderIcon`,
// `placeholder`, `focusable`, `rounded`, `className`, `contentClassName`)
// so we re-export it verbatim.

export { Avatar, type AvatarProps } from '../base/avatar/avatar';
