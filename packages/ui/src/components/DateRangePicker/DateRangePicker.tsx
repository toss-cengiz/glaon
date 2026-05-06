// Glaon DateRangePicker — thin wrap around the Untitled UI kit
// `application/date-picker/date-range-picker.tsx`. Per CLAUDE.md's
// UUI Source Rule, the structural HTML/CSS, popover positioning,
// two-month range calendar, preset panel (Today / Yesterday / This
// week / Last week / This month / Last month / This year / Last
// year), keyboard contract (RAC `<DateRangePicker>` +
// `<RangeCalendar>`), and the Apply / Cancel CTA chrome all come
// from the kit. Glaon's contribution is the wrap layer (token
// override via `theme.css`, prop API consistency, Figma
// `parameters.design` mapping in the story).
//
// Use this when the user must pick a start AND end date — analytics
// dashboards, log filters, billing-cycle pickers. For a single date,
// reach for `<DatePicker>` instead.

export { DateRangePicker } from '../application/date-picker/date-range-picker';
