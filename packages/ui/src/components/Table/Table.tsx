// Glaon Table — wraps the Untitled UI kit `Table` source under
// `packages/ui/src/components/application/table/table.tsx` and
// exposes a Phase-A cell-type catalog as static properties on
// `Table.Cell.*`. Per CLAUDE.md's UUI Source Rule, the structural
// HTML/CSS, sortable header glyphs, selection-mode checkbox column,
// sticky header, and keyboard navigation come from the kit (built on
// react-aria-components `<Table>` + `<TableHeader>` + `<Column>` +
// `<Row>` + `<Cell>` + `<TableBody>`). The cell-type sub-components
// ship under the UUI Source Rule's "no kit source" exception — the
// kit doesn't catalogue per-type cells; Glaon hand-rolls thin
// composition wraps over existing primitives so consumers get a
// single namespaced surface:
//
//   <Table aria-label="Devices" selectionMode="multiple">
//     <Table.Header columns={columns}>
//       {(col) => <Table.Head id={col.id} allowsSorting>{col.label}</Table.Head>}
//     </Table.Header>
//     <Table.Body items={data}>
//       {(item) => (
//         <Table.Row id={item.id} columns={columns}>
//           {(col) =>
//             col.id === 'name' ? (
//               <Table.Cell>
//                 <Table.Cell.Avatar src={item.avatar} primary={item.name} secondary={item.email} />
//               </Table.Cell>
//             ) : (
//               <Table.Cell>{item[col.id]}</Table.Cell>
//             )
//           }
//         </Table.Row>
//       )}
//     </Table.Body>
//   </Table>
//
// Cell-type catalog (#323 Phase A):
//   Table.Cell.Text             — primary + optional secondary line
//   Table.Cell.Avatar           — avatar + name + secondary
//   Table.Cell.Badge            — single status pill
//   Table.Cell.BadgesMultiple   — multi-tag with overflow `+N`
//   Table.Cell.Trend            — value + delta with up/down direction
//   Table.Cell.Progress         — bar + label
//   Table.Cell.StarRating       — N filled stars / max
//   Table.Cell.ActionButtons    — inline button row
//   Table.Cell.ActionIcons      — icon-only button row
//   Table.Cell.ActionDropdown   — `…` overflow menu trigger
//   Table.Cell.FileTypeIcon     — extension glyph + filename + size
//   Table.Cell.PaymentIcon      — payment method glyph + label + last4
//   Table.Cell.AvatarGroup      — overlapping avatars + `+N` count
//   Table.Cell.SelectDropdown   — inline editable native select
//
// `Table.Cell` itself is the kit cell primitive (the namespace target);
// the sub-components above plug into the cell's content area. They're
// pure composition wraps — every consumer can still pass raw text /
// JSX as `<Table.Cell>{value}</Table.Cell>`. Phase B layers a
// sortable `Table.HeadLabel`, Phase C ships a parametric empty state,
// and Phase D adds a per-row lead action column.

import { Table as KitTable } from '../application/table/table';
import { TableHeadLabel } from './parts/HeadLabel';
import {
  ActionButtonsCell,
  ActionDropdownCell,
  ActionIconsCell,
  AvatarCell,
  AvatarGroupCell,
  BadgeCell,
  BadgesMultipleCell,
  FileTypeIconCell,
  PaymentIconCell,
  ProgressCell,
  SelectDropdownCell,
  StarRatingCell,
  TextCell,
  TrendCell,
} from './cells';

export { TableCard, TableRowActionsDropdown } from '../application/table/table';
export * from './cells';
export { TableHeadLabel };
export type { TableHeadLabelProps } from './parts/HeadLabel';

// The kit's `Table` is itself a namespace (`Table.Header`, `Table.Row`,
// `Table.Cell`, …). Augment its static properties with the cell-type
// catalog by installing them under `Table.Cell.*`. We pin the
// exported type explicitly rather than letting `Object.assign` infer
// it — the kit's deep RAC generic chains aren't portably named and
// trip TS4023 / TS2742 under `declaration: true`.

type KitCell = (typeof KitTable)['Cell'];
type CellNamespace = KitCell & {
  Text: typeof TextCell;
  Avatar: typeof AvatarCell;
  Badge: typeof BadgeCell;
  BadgesMultiple: typeof BadgesMultipleCell;
  Trend: typeof TrendCell;
  Progress: typeof ProgressCell;
  StarRating: typeof StarRatingCell;
  ActionButtons: typeof ActionButtonsCell;
  ActionIcons: typeof ActionIconsCell;
  ActionDropdown: typeof ActionDropdownCell;
  FileTypeIcon: typeof FileTypeIconCell;
  PaymentIcon: typeof PaymentIconCell;
  AvatarGroup: typeof AvatarGroupCell;
  SelectDropdown: typeof SelectDropdownCell;
};

const CellWithCellTypes: CellNamespace = Object.assign(KitTable.Cell, {
  Text: TextCell,
  Avatar: AvatarCell,
  Badge: BadgeCell,
  BadgesMultiple: BadgesMultipleCell,
  Trend: TrendCell,
  Progress: ProgressCell,
  StarRating: StarRatingCell,
  ActionButtons: ActionButtonsCell,
  ActionIcons: ActionIconsCell,
  ActionDropdown: ActionDropdownCell,
  FileTypeIcon: FileTypeIconCell,
  PaymentIcon: PaymentIconCell,
  AvatarGroup: AvatarGroupCell,
  SelectDropdown: SelectDropdownCell,
});

type TableNamespace = typeof KitTable & {
  Cell: CellNamespace;
  HeadLabel: typeof TableHeadLabel;
};

export const Table: TableNamespace = Object.assign(KitTable, {
  Cell: CellWithCellTypes,
  HeadLabel: TableHeadLabel,
});
