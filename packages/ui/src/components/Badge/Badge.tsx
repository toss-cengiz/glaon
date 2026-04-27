// Glaon Badge — thin wrap around the Untitled UI kit `Badge` source under
// `packages/ui/src/components/base/badges/badges.tsx`. Per CLAUDE.md's UUI
// Source Rule, the structural HTML/CSS + variant matrix come from the
// kit; Glaon's contribution is the wrap layer (token override via
// `theme.css` + `glaon-overrides.css`, prop API consistency).
//
// We re-export the kit primitive verbatim so its full prop surface
// (`type`, `size`, `color`, `children`) is exposed to consumers as
// `Badge` from `@glaon/ui`. The kit additionally exposes
// `BadgeWithDot`, `BadgeWithIcon`, `BadgeWithFlag`, `BadgeWithImage`,
// `BadgeWithButton`, and `BadgeIcon`; surface them too so consumers can
// reach the full kit catalogue.

export {
  Badge,
  BadgeIcon,
  BadgeWithButton,
  BadgeWithDot,
  BadgeWithFlag,
  BadgeWithIcon,
  BadgeWithImage,
} from '../base/badges/badges';
