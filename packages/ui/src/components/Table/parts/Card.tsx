// Glaon Table.Card — outer chrome wrapper for tables. Phase E of
// #323. Mirrors Figma's Tables-page card chrome ([node 2218:469191](https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=2218-469191))
// — header (title + description + actions slot) + optional filters
// bar + the table itself + optional pagination.
//
// The kit already ships `TableCard.{Root, Header}`; this wrap re-
// exposes them under the Glaon-friendly `Table.Card.*` namespace
// (consistent with Phase A `Table.Cell.*` and Phase D `Table.LeadAction.*`),
// adds a `Filters` slot for the filters bar (consumer composes
// ButtonGroup + Select + Button etc.), and hand-rolls a simple
// `Pagination` primitive (the kit doesn't ship one — Phase 2 DataTable
// will swap in a richer paginator with virtualisation hooks).
//
// Compound API:
//
//   <Table.Card>
//     <Table.Card.Header
//       title="Team members"
//       description="Manage your team and their account permissions."
//       actions={<Button color="primary">Invite member</Button>}
//     />
//     <Table.Card.Filters>
//       <ButtonGroup defaultValue="all" aria-label="Status filter">
//         <ButtonGroup.Item value="all">All</ButtonGroup.Item>
//       </ButtonGroup>
//     </Table.Card.Filters>
//     <Table aria-label="Team members" …>{/* … */}</Table>
//     <Table.Card.Pagination
//       page={page}
//       pageCount={10}
//       onPageChange={setPage}
//     />
//   </Table.Card>

import { ChevronLeft, ChevronRight } from '@untitledui/icons';
import type { ReactNode } from 'react';

import { TableCard as KitTableCard } from '../../application/table/table';

function joinClasses(...parts: (string | undefined | false | null)[]): string {
  return parts.filter((p): p is string => Boolean(p)).join(' ');
}

// --- Card.Root + Card.Header — re-export the kit primitives -----------------

/**
 * Outer card surface — rounded ring + shadow + bg-primary. Re-exports
 * the kit `TableCard.Root` so consumers don't need to know the
 * application-tier layout to compose it.
 */
export const TableCardRoot = KitTableCard.Root;

interface TableCardHeaderProps {
  /** Title rendered as `<h2>`. */
  title: string;
  /** Optional subhead beneath the title. */
  description?: string;
  /** Optional badge node next to the title (e.g. `<Badge>120 users</Badge>`). */
  badge?: ReactNode;
  /** Trailing action slot — typically primary CTA + dropdown. */
  actions?: ReactNode;
  /** Tailwind override hook. */
  className?: string;
}

/**
 * Card header — title + optional description + optional trailing
 * actions (`<Button color="primary">Invite member</Button>` + dropdown).
 * Re-uses the kit `TableCard.Header`'s `contentTrailing` slot for the
 * actions; the Glaon `actions` prop name aligns with `Card.Header` /
 * `TopBar` semantics so consumers don't have to remember a slot
 * naming exception.
 */
export function TableCardHeader({
  title,
  description,
  badge,
  actions,
  className,
}: TableCardHeaderProps) {
  // Spread conditionally to avoid handing the kit an explicit
  // `undefined` for an optional prop (`exactOptionalPropertyTypes`).
  return (
    <KitTableCard.Header
      title={title}
      {...(description !== undefined ? { description } : {})}
      {...(badge !== undefined ? { badge } : {})}
      {...(actions !== undefined ? { contentTrailing: actions } : {})}
      {...(className !== undefined ? { className } : {})}
    />
  );
}

// --- Card.Filters — slot for the filters bar -------------------------------

interface TableCardFiltersProps {
  /** Slot content — ButtonGroup, Tabs, Select, Button mix. */
  children: ReactNode;
  /** Tailwind override hook. */
  className?: string;
}

/**
 * Filters bar slot rendered between the header and the table body.
 * Holds consumer-composed controls (ButtonGroup, Tabs, Select,
 * Button). The container is a flex row that wraps on narrow
 * viewports so filter controls stack instead of overflowing.
 *
 * `role="toolbar"` + an `aria-label` would be appropriate when the
 * filters all map to a single concept ("Status filter"); for mixed
 * controls leave `<div>` and let consumers add ARIA per-control.
 */
export function TableCardFilters({ children, className }: TableCardFiltersProps) {
  return (
    <div
      className={joinClasses(
        'flex flex-wrap items-center justify-between gap-3 border-b border-secondary px-4 py-3 md:px-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

// --- Card.Pagination — hand-rolled simple paginator ------------------------

export interface TableCardPaginationProps {
  /** Current page (1-indexed). */
  page: number;
  /** Total number of pages. */
  pageCount: number;
  /** Fires with the next page when prev / next or a page button is clicked. */
  onPageChange: (next: number) => void;
  /** Optional per-page selector. Pair with `perPageOptions` + `onPerPageChange`. */
  perPage?: number;
  perPageOptions?: readonly number[];
  onPerPageChange?: (next: number) => void;
  /**
   * Accessible label for the pagination nav.
   * @default 'Pagination'
   */
  ariaLabel?: string;
  /** Tailwind override hook. */
  className?: string;
}

/**
 * Hand-rolled pagination row — Prev / page count / Next pattern with
 * an optional per-page selector. Phase 2's `DataTable` swaps this for
 * a richer paginator (virtualisation hooks, page-jump input, total-
 * record counter); V1 covers the common "page X of Y" case.
 */
export function TableCardPagination({
  page,
  pageCount,
  onPageChange,
  perPage,
  perPageOptions,
  onPerPageChange,
  ariaLabel = 'Pagination',
  className,
}: TableCardPaginationProps) {
  const goPrev = () => {
    if (page > 1) onPageChange(page - 1);
  };
  const goNext = () => {
    if (page < pageCount) onPageChange(page + 1);
  };

  const showPerPage =
    perPage !== undefined && perPageOptions !== undefined && onPerPageChange !== undefined;

  return (
    <nav
      aria-label={ariaLabel}
      className={joinClasses(
        'flex flex-wrap items-center justify-between gap-3 border-t border-secondary px-4 py-3 md:px-6',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={page <= 1}
          aria-label="Previous page"
          className={navButtonClass}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Previous</span>
        </button>
      </div>
      <p className="text-sm font-medium text-secondary tabular-nums">
        Page {page.toString()} of {pageCount.toString()}
      </p>
      <div className="flex items-center gap-3">
        {showPerPage ? (
          <label className="flex items-center gap-2 text-sm text-tertiary">
            <span>Rows:</span>
            <select
              value={perPage}
              onChange={(event) => {
                onPerPageChange(Number(event.currentTarget.value));
              }}
              className="cursor-pointer rounded-md border border-primary bg-primary px-2 py-1 text-sm text-secondary"
              aria-label="Rows per page"
            >
              {perPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option.toString()}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <button
          type="button"
          onClick={goNext}
          disabled={page >= pageCount}
          aria-label="Next page"
          className={navButtonClass}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}

const navButtonClass =
  'inline-flex items-center gap-1.5 rounded-md border border-primary bg-primary px-3 py-1.5 text-sm font-semibold text-secondary outline-focus-ring transition hover:bg-primary_hover focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

// --- Namespace bundle -------------------------------------------------------

type TableCardNamespace = typeof TableCardRoot & {
  Root: typeof TableCardRoot;
  Header: typeof TableCardHeader;
  Filters: typeof TableCardFilters;
  Pagination: typeof TableCardPagination;
};

/**
 * `Table.Card` namespace — callable as the surface root (`<Table.Card>`)
 * or composed via the named sub-components (`Table.Card.Header`,
 * `Table.Card.Filters`, `Table.Card.Pagination`). Mirrors the
 * Dropdown / Tabs callable-namespace pattern so consumers don't
 * need to know whether the parent is a function or a bundle.
 */
export const TableCard: TableCardNamespace = Object.assign(TableCardRoot, {
  Root: TableCardRoot,
  Header: TableCardHeader,
  Filters: TableCardFilters,
  Pagination: TableCardPagination,
});
