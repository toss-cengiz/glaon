// Glaon Switch — thin wrap around the Untitled UI kit `Toggle` source
// under `packages/ui/src/components/base/toggle/toggle.tsx`. Per
// CLAUDE.md's UUI Source Rule, the structural HTML/CSS, focus /
// selected / disabled / hover state matrix come from the kit (built
// on react-aria-components `<Switch>`); Glaon's contribution is the
// wrap layer (token override + prop API consistency + Figma
// `parameters.design` mapping).
//
// We surface the kit `Toggle` under the more idiomatic `Switch` Glaon
// name. `ToggleBase` stays as-is for consumers that want the
// unwrapped primitive.

export { Toggle as Switch, ToggleBase } from '../base/toggle/toggle';
