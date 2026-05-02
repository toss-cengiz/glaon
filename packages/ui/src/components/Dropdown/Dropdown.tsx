// Glaon Dropdown — menu trigger + sectioned items primitive. Thin
// re-export of the kit's `Dropdown` namespace under
// `packages/ui/src/components/base/dropdown/dropdown.tsx`. Per
// CLAUDE.md's UUI Source Rule, the structural HTML/CSS, the
// react-aria-components `<MenuTrigger>` + `<Menu>` + `<MenuItem>`
// keyboard contract (Arrow / Enter / Escape / typeahead), and the
// selection indicator matrix (checkmark / checkbox / radio / toggle)
// come from the kit; Glaon's contribution is the wrap layer (Phase
// 1.5 controls.ts + MDX + stories) and the callable namespace shape.
//
// Distinct from Select (P7): Select is a form-input picker for
// single/multi value with a `selectedKey`; Dropdown is an action menu
// with item handlers + optional selection-state indicators.
//
// Distinct from Popover (P13): Popover is a generic anchored overlay
// with arbitrary content; Dropdown is a menu-pattern primitive with
// the WAI-ARIA `menu` role hierarchy baked in.
//
// Maps Figma's `web-primitives-dropdown` axes:
//   - Item:    Icon × Checkbox (selection indicator) × State × Divider
//   - Header:  Avatar group / Header (compose via `Dropdown.SectionHeader`)
//   - Trigger: Icon / Button / Avatar (compose as the first child of
//             `<Dropdown />` — typically `<Button>`, `<Avatar>`, or
//             `<Dropdown.DotsButton>`)
//
// Usage:
//
//   <Dropdown>
//     <Button iconTrailing={ChevronDown}>Options</Button>
//     <Dropdown.Popover>
//       <Dropdown.Menu>
//         <Dropdown.Item icon={Eye} label="View profile" />
//         <Dropdown.Item icon={Settings} label="Settings" />
//         <Dropdown.Separator />
//         <Dropdown.Item icon={LogOut} label="Sign out" />
//       </Dropdown.Menu>
//     </Dropdown.Popover>
//   </Dropdown>
//
// The Glaon `Dropdown` is a callable namespace — `<Dropdown>` is the
// MenuTrigger root (alias for `Dropdown.Root` / kit's
// `<MenuTrigger>`). Sub-components live as static properties:
//
//   Dropdown.Popover       — popover container (rounded-lg, shadow-lg)
//   Dropdown.Menu          — <Menu> list (RAC)
//   Dropdown.Section       — <MenuSection> grouped section
//   Dropdown.SectionHeader — <Header> grouped section heading
//   Dropdown.Item          — <MenuItem> with icon / avatar / addon /
//                            selectionIndicator slots
//   Dropdown.Separator     — divider line between items
//   Dropdown.DotsButton    — pre-built `...` overflow trigger button

import type { ComponentProps } from 'react';

import { Dropdown as KitDropdown } from '../base/dropdown/dropdown';

// Wrap the kit's `MenuTrigger` (`Dropdown.Root`) as a real callable
// component so `Meta<typeof Dropdown>` resolves to a concrete React
// component for Storybook docgen. The static properties inherit the
// kit's sub-components verbatim — no behaviour change.
function DropdownRoot(props: ComponentProps<typeof KitDropdown.Root>) {
  return <KitDropdown.Root {...props} />;
}

type DropdownNamespace = typeof DropdownRoot & {
  Root: typeof KitDropdown.Root;
  Popover: typeof KitDropdown.Popover;
  Menu: typeof KitDropdown.Menu;
  Section: typeof KitDropdown.Section;
  SectionHeader: typeof KitDropdown.SectionHeader;
  Item: typeof KitDropdown.Item;
  Separator: typeof KitDropdown.Separator;
  DotsButton: typeof KitDropdown.DotsButton;
};

export const Dropdown: DropdownNamespace = Object.assign(DropdownRoot, {
  Root: KitDropdown.Root,
  Popover: KitDropdown.Popover,
  Menu: KitDropdown.Menu,
  Section: KitDropdown.Section,
  SectionHeader: KitDropdown.SectionHeader,
  Item: KitDropdown.Item,
  Separator: KitDropdown.Separator,
  DotsButton: KitDropdown.DotsButton,
});
