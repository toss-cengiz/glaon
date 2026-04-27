// Glaon Input — thin wrap around the Untitled UI kit `Input` source
// under `packages/ui/src/components/base/input/input.tsx`. Per CLAUDE.md's
// UUI Source Rule, the structural HTML/CSS, focus / invalid / disabled
// state matrix, and built-in password-toggle affordance come from the
// kit; Glaon's contribution is the wrap layer (token override via
// `theme.css` + `glaon-overrides.css`, prop API consistency, Figma
// `parameters.design` mapping in the story).
//
// The kit ships several siblings (`InputBase`, `TextField`) that
// consumers may need — re-export them too so `@glaon/ui` exposes the
// full kit catalogue.

export {
  Input,
  InputBase,
  TextField,
  type InputBaseProps,
  type InputProps,
  type TextFieldProps,
} from '../base/input/input';
