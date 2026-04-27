// Glaon Tabs — thin wrap around the Untitled UI kit `Tabs` family
// under `packages/ui/src/components/application/tabs/tabs.tsx`. Per
// CLAUDE.md's UUI Source Rule, the structural HTML/CSS, focus / hover
// state matrix, and orientation handling come from the kit (built on
// react-aria-components `<Tabs>` + `<TabList>` + `<Tab>` +
// `<TabPanel>`); Glaon's contribution is the wrap layer (token
// override via `theme.css` + `glaon-overrides.css`, prop API
// consistency, Figma `parameters.design` mapping in the story).
//
// Sub-components are exposed via the static-property pattern so
// consumers compose tabs inline:
//
//   <Tabs defaultSelectedKey="overview">
//     <Tabs.List>
//       <Tabs.Trigger id="overview" label="Overview" />
//       <Tabs.Trigger id="settings" label="Settings" />
//     </Tabs.List>
//     <Tabs.Content id="overview">…</Tabs.Content>
//     <Tabs.Content id="settings">…</Tabs.Content>
//   </Tabs>
//
// We use the Radix-style names (`Trigger` / `Content`) on the namespace
// to match application-team expectations while still re-exporting the
// kit's RAC-aligned names (`Tab` / `TabPanel`) for direct use.

import {
  Tab as KitTab,
  TabList as KitTabList,
  TabPanel as KitTabPanel,
  Tabs as KitTabs,
} from '../application/tabs/tabs';

// Direct re-exports for kit-aligned consumers.
export { KitTabList as TabList, KitTab as Tab, KitTabPanel as TabPanel };

// Static-property namespace so consumers can compose tabs inline:
//
//   <Tabs defaultSelectedKey="x">
//     <Tabs.List>…<Tabs.Trigger /></Tabs.List>
//     <Tabs.Content id="x">…</Tabs.Content>
//   </Tabs>
//
// We pin the exported type explicitly rather than letting
// `Object.assign` infer it — the kit's `TabComponentProps` /
// `TabListComponentProps` aren't exported, and the inferred shape
// trips TS4023 under `declaration: true`.
type TabsNamespace = typeof KitTabs & {
  List: typeof KitTabList;
  Trigger: typeof KitTab;
  Content: typeof KitTabPanel;
};

export const Tabs: TabsNamespace = Object.assign(KitTabs, {
  List: KitTabList,
  Trigger: KitTab,
  Content: KitTabPanel,
});
