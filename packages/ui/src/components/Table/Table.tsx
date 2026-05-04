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

import type { ComponentProps, ReactNode } from 'react';
import { createContext, useContext } from 'react';

import { Table as KitTable } from '../application/table/table';
import { TableCard } from './parts/Card';
import { TableEmpty } from './parts/Empty';
import { TableHeadLabel } from './parts/HeadLabel';
import { LeadAction } from './parts/LeadAction';
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

export { TableRowActionsDropdown } from '../application/table/table';
export { LeadActionCheckbox, LeadActionRadio, LeadActionToggle } from './parts/LeadAction';
export type {
  LeadActionCheckboxProps,
  LeadActionRadioProps,
  LeadActionToggleProps,
} from './parts/LeadAction';
export * from './cells';
export { TableEmpty, TableHeadLabel };
export {
  TableCard,
  TableCardFilters,
  TableCardHeader,
  TableCardPagination,
  TableCardRoot,
} from './parts/Card';
export type { TableCardPaginationProps } from './parts/Card';
export type { TableEmptyAction, TableEmptyProps } from './parts/Empty';
export type { TableHeadLabelProps } from './parts/HeadLabel';

// Empty-state context — `<Table emptyState={…}>` writes the node;
// the wrapped `<Table.Body>` reads it and forwards as
// `renderEmptyState` so consumers don't need to hand-wire the
// callback. Per-body `renderEmptyState` overrides the context if
// both are set.
const EmptyStateContext = createContext<ReactNode | undefined>(undefined);

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

// Glaon `<Table>` wraps the kit primitive to surface a root
// `emptyState` prop — when set, the wrapped `<Table.Body>` reads it
// from context and forwards as `renderEmptyState` so consumers don't
// re-wire the callback per usage. Body-level `renderEmptyState`
// overrides the root prop if both are passed.
type KitTableProps = ComponentProps<typeof KitTable>;
export interface TableProps extends Omit<KitTableProps, 'children'> {
  /**
   * Auto-rendered empty-state node when the body has zero rows.
   * Pass `<Table.Empty …/>` for the canonical layout, or any custom
   * ReactNode to override completely. Per-body `renderEmptyState`
   * still wins if both are set.
   */
  emptyState?: ReactNode;
  children?: ReactNode;
}

function TableRoot({ emptyState, children, ...props }: TableProps) {
  return (
    <EmptyStateContext.Provider value={emptyState}>
      <KitTable {...props}>{children}</KitTable>
    </EmptyStateContext.Provider>
  );
}

type KitBodyProps = ComponentProps<typeof KitTable.Body>;
function TableBodyWithEmpty(props: KitBodyProps) {
  const contextEmpty = useContext(EmptyStateContext);
  // Spread `renderEmptyState` conditionally — RAC's body type rejects
  // an explicit `undefined` under `exactOptionalPropertyTypes`. Body-
  // level `renderEmptyState` always wins; only fall back to context
  // when the body didn't supply its own.
  if (props.renderEmptyState !== undefined) {
    return <KitTable.Body {...props} />;
  }
  if (contextEmpty !== undefined) {
    return <KitTable.Body {...props} renderEmptyState={() => contextEmpty} />;
  }
  return <KitTable.Body {...props} />;
}
TableBodyWithEmpty.displayName = 'Table.Body';

type TableNamespace = typeof TableRoot & {
  Header: (typeof KitTable)['Header'];
  Head: (typeof KitTable)['Head'];
  Row: (typeof KitTable)['Row'];
  Body: typeof TableBodyWithEmpty;
  Cell: CellNamespace;
  HeadLabel: typeof TableHeadLabel;
  Empty: typeof TableEmpty;
  LeadAction: typeof LeadAction;
  Card: typeof TableCard;
};

export const Table: TableNamespace = Object.assign(TableRoot, {
  Header: KitTable.Header,
  Head: KitTable.Head,
  Row: KitTable.Row,
  Body: TableBodyWithEmpty,
  Cell: CellWithCellTypes,
  HeadLabel: TableHeadLabel,
  Empty: TableEmpty,
  LeadAction,
  Card: TableCard,
});
