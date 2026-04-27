// Glaon Radio — thin wrap around the Untitled UI kit `RadioButton`
// source under `packages/ui/src/components/base/radio-buttons/radio-buttons.tsx`.
// Per CLAUDE.md's UUI Source Rule, the structural HTML/CSS, focus /
// selected / disabled state matrix come from the kit (built on
// react-aria-components `<Radio>` + `<RadioGroup>`); Glaon's
// contribution is the wrap layer (token override + prop API
// consistency + Figma `parameters.design` mapping).
//
// We expose the kit `RadioButton` under the shorter `Radio` Glaon name
// to match common React/web idiom while keeping `RadioGroup` as the
// canonical wrapper. `RadioButtonBase` stays as-is for consumers that
// want the unwrapped primitive.

export {
  RadioButton as Radio,
  RadioButtonBase,
  RadioGroup,
} from '../base/radio-buttons/radio-buttons';
