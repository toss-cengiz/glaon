// Glaon Table.HeadLabel — typography wrapper for column header
// labels. Phase B of #323. The kit `<Table.Head>` already handles
// the structural plumbing (the sortable chevron / arrow comes from
// `allowsSorting` on the `<Column>`, the `?` help-icon comes from
// the `tooltip` prop). HeadLabel is the canonical way to wrap the
// visible label text so every Glaon table renders the same
// `font-semibold` + `text-secondary` typography without consumers
// repeating the class set per cell.
//
// Usage:
//
//   <Table.Head id="role" allowsSorting tooltip="Default role assigned at invite time.">
//     <Table.HeadLabel>Role</Table.HeadLabel>
//   </Table.Head>
//
// The `tooltip` + `allowsSorting` props live on `<Table.Head>` and
// the kit already renders them inline with the children — we don't
// re-implement either in HeadLabel.

import type { ReactNode } from 'react';

export interface TableHeadLabelProps {
  /** Tailwind override hook. */
  className?: string;
  /** Visible label text. */
  children: ReactNode;
}

function joinClasses(...parts: (string | undefined | false | null)[]): string {
  return parts.filter((p): p is string => Boolean(p)).join(' ');
}

/**
 * Typography wrapper for column header labels — `font-semibold` +
 * `text-secondary` on a single-line span. Drop inside a
 * `<Table.Head>` to align with Figma's `_Table header label`
 * frame. Combine with the host `<Table.Head>`'s `tooltip` prop and
 * `allowsSorting` to surface the help-icon and sort affordance.
 */
export function TableHeadLabel({ className, children }: TableHeadLabelProps) {
  return (
    <span
      className={joinClasses('whitespace-nowrap text-sm font-semibold text-secondary', className)}
    >
      {children}
    </span>
  );
}
