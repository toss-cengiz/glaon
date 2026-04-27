// Glaon Textarea — thin wrap around the Untitled UI kit `TextArea`
// source under `packages/ui/src/components/base/textarea/textarea.tsx`.
// Per CLAUDE.md's UUI Source Rule, the structural HTML/CSS, focus /
// invalid / disabled state matrix, and resize-handle styling come from
// the kit; Glaon's contribution is the wrap layer (token override via
// `theme.css` + `glaon-overrides.css`, prop API consistency, Figma
// `parameters.design` mapping in the story).
//
// We surface the kit's casing (`TextArea`) under the Glaon name
// `Textarea` (one capital A) to match common React/web idiom while
// keeping the kit re-export clean. `TextAreaBase` stays as-is for
// consumers that want the unwrapped primitive.

export { TextArea as Textarea, TextAreaBase } from '../base/textarea/textarea';
