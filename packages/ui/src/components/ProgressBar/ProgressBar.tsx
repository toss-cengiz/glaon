// Glaon ProgressBar — thin wrap around the Untitled UI kit
// `progress-indicators` source. Re-exports `ProgressBarBase` (label-less)
// and `ProgressBar` (with optional label position). Glaon's contribution
// is the wrap layer (token override + prop API consistency); structural
// HTML/CSS + variant matrix come from the kit.

export {
  ProgressBar,
  ProgressBarBase,
  type ProgressBarProps,
  type ProgressIndicatorWithTextProps,
} from '../base/progress-indicators/progress-indicators';
