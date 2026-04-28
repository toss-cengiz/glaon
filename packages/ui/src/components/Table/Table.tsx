// Glaon Table — thin wrap around the Untitled UI kit `Table` source
// under `packages/ui/src/components/application/table/table.tsx`.
// Per CLAUDE.md's UUI Source Rule, the structural HTML/CSS, sortable
// header glyphs, selection-mode checkbox column, sticky header, and
// keyboard navigation come from the kit (built on react-aria-components
// `<Table>` + `<TableHeader>` + `<Column>` + `<Row>` + `<Cell>` +
// `<TableBody>`). Glaon's contribution is the wrap layer (token
// override, prop API consistency, Figma `parameters.design` mapping).
//
// The kit attaches sub-components as static properties on `Table`:
//
//   <Table aria-label="Devices" selectionMode="multiple">
//     <Table.Header columns={columns}>
//       {(col) => <Table.Head id={col.id} allowsSorting>{col.label}</Table.Head>}
//     </Table.Header>
//     <Table.Body items={data}>
//       {(item) => (
//         <Table.Row id={item.id} columns={columns}>
//           {(col) => <Table.Cell>{item[col.id]}</Table.Cell>}
//         </Table.Row>
//       )}
//     </Table.Body>
//   </Table>
//
// Phase 1 ships the basic surface — sortable single-column header,
// row selection, sticky header. Pagination, virtualization,
// resizable columns, multi-column sort, and faceted filtering all
// land in Phase 2's `DataTable` application primitive.

export { Table, TableCard, TableRowActionsDropdown } from '../application/table/table';
