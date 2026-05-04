// `Table.controls.ts` — single source of truth for Table's variant
// matrix. Story (`Table.stories.tsx`) imports the spec and spreads
// it into `meta.args` / `meta.argTypes`; MDX docs (`Table.mdx`)
// reads the same spec via `<Controls />`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

const sizeOptions = ['sm', 'md'] as const;
const selectionModeOptions = ['none', 'single', 'multiple'] as const;

export const tableControls = {
  'aria-label': {
    type: 'text',
    default: 'Devices',
    description:
      'Accessible name for the entire table — required for axe `aria-required-children` / `region`. Pair with a visible heading above the table when one exists; for a heading-less surface this prop is the only label.',
    category: 'A11y',
  } satisfies ControlSpec<string>,
  size: {
    type: 'inline-radio',
    options: sizeOptions,
    default: 'md',
    description:
      'Vertical density. `md` (default) for standard data; `sm` for dense surfaces (admin tables, log readers) where many rows must fit on screen.',
    category: 'Style',
  } satisfies ControlSpec<(typeof sizeOptions)[number]>,
  selectionMode: {
    type: 'inline-radio',
    options: selectionModeOptions,
    description:
      '`none` (default) for read-only data, `single` for radio-style row selection, `multiple` for checkbox column with optional select-all in the header.',
    category: 'Behavior',
  } satisfies ControlSpec<(typeof selectionModeOptions)[number]>,
  onRowAction: {
    type: false,
    action: 'row-action',
    description:
      'Fires on row activation (click / Enter). RAC routes Space to selection (when `selectionMode` is set) and Enter to row action — keep them distinct so keyboard users can pick *and* open.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onSelectionChange: {
    type: false,
    action: 'selection-changed',
    description:
      'Fires when the selected row set changes (RAC contract — receives a `Set<Key> | "all">`).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onSortChange: {
    type: false,
    action: 'sort-changed',
    description:
      'Fires when the sort descriptor changes (RAC contract — receives `{ column, direction }`). Set `<Table.Head allowsSorting>` to opt a column in.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  children: {
    type: false,
    description:
      'Compose with `<Table.Header>` containing one `<Table.Head id="…">` per column, then `<Table.Body>` containing one `<Table.Row id="…">` per data row, each housing `<Table.Cell>` children.',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
  className: {
    type: false,
    description: 'Tailwind override hook for the outer `<table>` wrapper.',
    category: 'Style',
  } satisfies ControlSpec<string>,
} as const;

// RAC-forwarded props that aren't useful as Storybook controls but
// flow through type-checking; covered by the F6 prop-coverage gate.
export const tableExcludeFromArgs = defineExcludeFromArgs([
  'aria-labelledby',
  'aria-describedby',
  'aria-details',
  'translate',
  'slot',
  'data-rac',
  'autoFocus',
  'selectedKeys',
  'defaultSelectedKeys',
  'disabledKeys',
  'disallowEmptySelection',
  'selectionBehavior',
  'sortDescriptor',
  'defaultSortDescriptor',
  'dependencies',
  'dragAndDropHooks',
  'isDisabled',
  'escapeKeyBehavior',
  // F6 gate's docgen treats the first re-exported component with
  // props as the file's "primary" component. Since `Table.tsx` re-
  // exports `LeadActionCheckbox` (Phase D) and the kit `Table` props
  // get propFilter-stripped, docgen lands on LeadActionCheckbox's
  // surface. The four props below come from LeadActionCheckboxProps;
  // they're documented in MDX + exercised in the dedicated stories
  // (`WithCheckboxColumn` / `WithRadioSelection` / `WithToggleColumn`),
  // so the controls-panel knobs would be redundant noise.
  'value',
  'onChange',
  'isIndeterminate',
  'ariaLabel',
] as const);
