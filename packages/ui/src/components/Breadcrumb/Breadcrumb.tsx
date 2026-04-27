// Glaon Breadcrumb — thin wrap around the Untitled UI kit
// `Breadcrumbs` family under
// `packages/ui/src/components/application/breadcrumbs/`. Per
// CLAUDE.md's UUI Source Rule, the structural HTML/CSS, divider
// matrix, ellipsis truncation, and account-item dropdown variant
// come from the kit (built on react-aria-components `<Breadcrumbs>`);
// Glaon's contribution is the wrap layer (token override via
// `theme.css` + `glaon-overrides.css`, prop API consistency, Figma
// `parameters.design` mapping in the story).
//
// We expose the kit `Breadcrumbs` (plural — matches the `<nav
// aria-label="Breadcrumbs">` landmark) under both the singular
// `Breadcrumb` and the plural `Breadcrumbs` Glaon names so consumers
// can pick whichever idiom fits their codebase. The static-property
// namespace exposes `Breadcrumb.Item` / `Breadcrumb.AccountItem` for
// inline composition (Radix-style consumers expect this shape).

// Import order matters here: the kit's `breadcrumbs.tsx` and
// `breadcrumb-account-item.tsx` form a circular dependency
// (`breadcrumbs.tsx` imports `BreadcrumbAccountItem`; the
// account-item file imports `BreadcrumbsContext` back). Hoisting the
// `breadcrumbs.tsx` import first lets the runtime initialize the
// context before the account-item module evaluates, avoiding a TDZ
// `Cannot access 'BreadcrumbAccountItem' before initialization`
// error in the storybook test runtime.
import {
  Breadcrumbs as KitBreadcrumbs,
  BreadcrumbsContext,
  type BreadcrumbType,
} from '../application/breadcrumbs/breadcrumbs';
import {
  BreadcrumbAccountItem,
  type BreadcrumbAccountItemData,
} from '../application/breadcrumbs/breadcrumb-account-item';
import { BreadcrumbItem } from '../application/breadcrumbs/breadcrumb-item';

// Direct re-exports for kit-aligned consumers.
export {
  BreadcrumbItem,
  BreadcrumbAccountItem,
  KitBreadcrumbs as Breadcrumbs,
  BreadcrumbsContext,
  type BreadcrumbType,
  type BreadcrumbAccountItemData,
};

// Singular `Breadcrumb` namespace for application-team idiom.
type BreadcrumbNamespace = typeof KitBreadcrumbs & {
  Item: typeof BreadcrumbItem;
  AccountItem: typeof BreadcrumbAccountItem;
};

export const Breadcrumb: BreadcrumbNamespace = Object.assign(KitBreadcrumbs, {
  Item: BreadcrumbItem,
  AccountItem: BreadcrumbAccountItem,
});
