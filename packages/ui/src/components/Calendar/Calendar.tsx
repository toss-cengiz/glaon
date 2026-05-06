// Glaon Calendar — inline calendar grid (no trigger, no popover).
// Thin wrap around the Untitled UI kit
// `application/date-picker/calendar.tsx`. Per CLAUDE.md's UUI Source
// Rule, the structural HTML/CSS, month/year navigation, day cell
// rendering, and keyboard contract (RAC `<Calendar>`) all come from
// the kit. Glaon's contribution is the wrap layer (token override,
// prop API consistency, Figma `parameters.design` mapping).
//
// Use this when the calendar lives directly in the page surface —
// dashboards with an embedded mini-calendar, scheduling editors,
// availability planners. For a calendar that opens from a button
// trigger, reach for `<DatePicker>` instead.

export { Calendar } from '../application/date-picker/calendar';
