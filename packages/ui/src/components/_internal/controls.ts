// `defineControls` — typed config → Storybook `meta.args` + `meta.argTypes`.
//
// Phase 1.5 introduces a `<Component>.controls.ts` file next to every
// `<Component>.stories.tsx`. The controls file declares each public prop
// once: its Storybook control type, options, default value, and a
// human-readable description. The story imports the spec, calls
// `defineControls()`, and spreads the result into the story meta. Same
// spec can be referenced from `<Component>.mdx` so the docs panel
// matches the controls panel verbatim.
//
// The helper output shape is intentionally aligned with the F6
// prop-coverage gate (`packages/ui/src/__tests__/prop-coverage.test.ts`)
// — `args` keys + `argTypes` keys + the optional named-export
// `excludeFromArgs` array still satisfy the "every prop covered" rule
// without changes to the test.

import type { Args, ArgTypes } from '@storybook/react-native-web-vite';

/**
 * Storybook control category — drives the grouping in the controls
 * panel. Keep the set small and stable so docs stay scannable.
 */
export type ControlCategory = 'Content' | 'Style' | 'Behavior' | 'A11y';

/**
 * One control spec for a single prop. The `type` mirrors Storybook's
 * `argTypes[key].control.type` plus the literal `false` to disable the
 * row entirely (e.g. for kit-internal slot props).
 */
export interface ControlSpec<TValue> {
  /** Storybook control flavour. `false` hides the control row. */
  type: 'text' | 'boolean' | 'inline-radio' | 'select' | 'number' | 'object' | 'color' | false;
  /** Enum / select options. Required when `type` is `inline-radio` or `select`. */
  options?: readonly TValue[];
  /** Default value rendered in `meta.args`. */
  default?: TValue;
  /** Number control min (only when `type === 'number'`). */
  min?: number;
  /** Number control max (only when `type === 'number'`). */
  max?: number;
  /** Number control step (only when `type === 'number'`). */
  step?: number;
  /**
   * Human-readable description of what this prop does. Surfaces in
   * the Storybook controls panel and (when MDX docs reference the
   * same spec) in the docs page.
   */
  description: string;
  /** Optional grouping in the controls panel. */
  category?: ControlCategory;
  /**
   * Mapping table for icon-style picker — `{ none: undefined, plus: PlusIcon }`.
   * Storybook renders the keys as the picker labels and forwards the
   * mapped values as the actual prop value.
   */
  mapping?: Record<string, unknown>;
  /**
   * Storybook action name for callback props (`{ action: 'pressed' }`
   * fires actions panel events on activation).
   */
  action?: string;
}

/** Map of prop name → control spec. */
type ComponentControls = Record<string, ControlSpec<unknown>>;

/**
 * Compile a controls spec into Storybook's `meta.args` + `meta.argTypes`.
 *
 * - `args` carries every spec entry that has a `default` (so the story
 *   renders with realistic initial state).
 * - `argTypes` carries every spec entry's full `control` config plus
 *   `description` and `table.category`, so the controls panel and
 *   autodocs render the right widget and copy.
 *
 * The keys returned in both objects mirror the spec keys exactly, so
 * the F6 prop-coverage gate's union check (`args ∪ argTypes ∪
 * excludeFromArgs`) stays satisfied without any test changes.
 */
export function defineControls(spec: ComponentControls): {
  args: Args;
  argTypes: Partial<ArgTypes>;
} {
  const args: Args = {};
  const argTypes: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(spec)) {
    if (entry.default !== undefined) {
      args[key] = entry.default;
    }
    argTypes[key] = toArgType(entry);
  }

  return { args, argTypes: argTypes as Partial<ArgTypes> };
}

function toArgType(entry: ControlSpec<unknown>): unknown {
  const table: { category?: string; disable?: boolean } = {};
  if (entry.category !== undefined) {
    table.category = entry.category;
  }
  if (entry.type === false) {
    table.disable = true;
    const result: Record<string, unknown> = {
      control: false,
      description: entry.description,
      table,
    };
    if (entry.action !== undefined) {
      result.action = entry.action;
    }
    return result;
  }

  let control: unknown;
  if (entry.type === 'number') {
    const numberControl: { type: 'number'; min?: number; max?: number; step?: number } = {
      type: 'number',
    };
    if (entry.min !== undefined) numberControl.min = entry.min;
    if (entry.max !== undefined) numberControl.max = entry.max;
    if (entry.step !== undefined) numberControl.step = entry.step;
    control = numberControl;
  } else if (entry.type === 'inline-radio' || entry.type === 'select') {
    control = entry.type;
  } else {
    control = entry.type;
  }

  const result: Record<string, unknown> = {
    control,
    description: entry.description,
    table,
  };
  if (entry.options !== undefined) {
    result.options = entry.options;
  }
  if (entry.mapping !== undefined) {
    result.mapping = entry.mapping;
  }
  if (entry.action !== undefined) {
    result.action = entry.action;
  }
  return result;
}

/**
 * Marker helper for the F6 prop-coverage gate. Pass any prop names that
 * the gate's `react-docgen-typescript` introspection extracts but that
 * the controls spec deliberately omits (RAC-internal `slot`,
 * `aria-*`-forwarded props, kit-internal class names, etc.).
 *
 * Returns the input array unchanged — the helper exists so each
 * controls file imports it explicitly and the named-export contract
 * with the gate is documented.
 */
export function excludeFromArgs(props: readonly string[]): readonly string[] {
  return props;
}
