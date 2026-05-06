// Glaon DatePicker — thin wrap around the Untitled UI kit
// `application/date-picker/date-picker.tsx`. Per CLAUDE.md's UUI
// Source Rule, the structural HTML/CSS, popover positioning,
// month/year navigation, keyboard contract (RAC `<DatePicker>` +
// `<Calendar>`), and the Apply / Cancel CTA chrome all come from
// the kit. Glaon's contribution is the wrap layer (token override
// via `theme.css`, prop API consistency, Figma `parameters.design`
// mapping in the story).
//
// The kit ships application-level — DatePicker is the trigger
// (Glaon Button styled with the calendar icon) plus an anchored
// popover containing the inline Calendar. Use this when a quick
// date pick is part of a form / filter row.

export { DatePicker } from '../application/date-picker/date-picker';
