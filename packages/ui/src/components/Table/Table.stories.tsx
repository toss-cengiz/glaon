import { Edit01, Eye, Plus, Trash01, Users01 } from '@untitledui/icons';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';

import { defineControls } from '../_internal/controls';
import { Badge } from '../Badge';
import { Table } from './Table';
import { tableControls, tableExcludeFromArgs } from './Table.controls';

const { args, argTypes } = defineControls(tableControls);

// Explicit `Meta<typeof Table>` annotation (rather than `satisfies`)
// keeps the kit's deep RAC generic chains and the merged static-
// property type out of the exported `meta` signature — `tsc --noEmit`
// runs with `declaration: true`.
//
// Phase 1.5: `args` + `argTypes` come from `Table.controls.ts`;
// `tags: ['autodocs']` removed because `Table.mdx` replaces the
// docs tab.
const meta: Meta<typeof Table> = {
  title: 'Web Primitives/Table',
  component: Table,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-table',
    },
  },
  args,
  argTypes,
  decorators: [
    (Story) => (
      <div style={{ width: 720 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Table>;

export const excludeFromArgs = tableExcludeFromArgs;

interface DeviceRow {
  id: string;
  name: string;
  room: string;
  status: 'online' | 'offline' | 'updating';
  lastSeen: string;
}

const devices: DeviceRow[] = [
  {
    id: '1',
    name: 'Living room thermostat',
    room: 'Living room',
    status: 'online',
    lastSeen: '2 min ago',
  },
  {
    id: '2',
    name: 'Kitchen light strip',
    room: 'Kitchen',
    status: 'online',
    lastSeen: '5 min ago',
  },
  {
    id: '3',
    name: 'Front door camera',
    room: 'Entrance',
    status: 'offline',
    lastSeen: '3 days ago',
  },
  {
    id: '4',
    name: 'Bedroom blinds',
    room: 'Bedroom',
    status: 'updating',
    lastSeen: '1 min ago',
  },
];

const statusBadge = (status: DeviceRow['status']) => {
  if (status === 'online') return <Badge color="success">Online</Badge>;
  if (status === 'updating') return <Badge color="warning">Updating</Badge>;
  return <Badge color="error">Offline</Badge>;
};

export const Default: Story = {
  render: (args) => (
    <Table {...args}>
      <Table.Header>
        <Table.Head id="name">Device</Table.Head>
        <Table.Head id="room">Room</Table.Head>
        <Table.Head id="status">Status</Table.Head>
        <Table.Head id="lastSeen">Last seen</Table.Head>
      </Table.Header>
      <Table.Body>
        {devices.map((device) => (
          <Table.Row key={device.id} id={device.id}>
            <Table.Cell>
              <span className="font-medium text-primary">{device.name}</span>
            </Table.Cell>
            <Table.Cell>{device.room}</Table.Cell>
            <Table.Cell>{statusBadge(device.status)}</Table.Cell>
            <Table.Cell>{device.lastSeen}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  ),
};

export const WithSortableHeader: Story = {
  render: (args) => (
    <Table {...args}>
      <Table.Header>
        <Table.Head id="name" allowsSorting>
          <Table.HeadLabel>Device</Table.HeadLabel>
        </Table.Head>
        <Table.Head id="room" allowsSorting>
          <Table.HeadLabel>Room</Table.HeadLabel>
        </Table.Head>
        <Table.Head id="status">
          <Table.HeadLabel>Status</Table.HeadLabel>
        </Table.Head>
        <Table.Head id="lastSeen" allowsSorting>
          <Table.HeadLabel>Last seen</Table.HeadLabel>
        </Table.Head>
      </Table.Header>
      <Table.Body>
        {devices.map((device) => (
          <Table.Row key={device.id} id={device.id}>
            <Table.Cell>
              <span className="font-medium text-primary">{device.name}</span>
            </Table.Cell>
            <Table.Cell>{device.room}</Table.Cell>
            <Table.Cell>{statusBadge(device.status)}</Table.Cell>
            <Table.Cell>{device.lastSeen}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  ),
};

// `Table.HeadLabel` + `tooltip` prop on `<Table.Head>` — the kit
// renders a `?` icon next to the label that opens the help tooltip
// on hover / focus. Pair with `allowsSorting` for "this column can
// be sorted, here's what it means" affordances.
export const WithHelpIcon: Story = {
  render: (args) => (
    <Table {...args}>
      <Table.Header>
        <Table.Head id="name">
          <Table.HeadLabel>Device</Table.HeadLabel>
        </Table.Head>
        <Table.Head
          id="room"
          allowsSorting
          tooltip="The room the device is paired with — change in device settings."
        >
          <Table.HeadLabel>Room</Table.HeadLabel>
        </Table.Head>
        <Table.Head
          id="status"
          tooltip="Online means the device responded within the last 5 minutes."
        >
          <Table.HeadLabel>Status</Table.HeadLabel>
        </Table.Head>
        <Table.Head id="lastSeen" allowsSorting>
          <Table.HeadLabel>Last seen</Table.HeadLabel>
        </Table.Head>
      </Table.Header>
      <Table.Body>
        {devices.map((device) => (
          <Table.Row key={device.id} id={device.id}>
            <Table.Cell>
              <span className="font-medium text-primary">{device.name}</span>
            </Table.Cell>
            <Table.Cell>{device.room}</Table.Cell>
            <Table.Cell>{statusBadge(device.status)}</Table.Cell>
            <Table.Cell>{device.lastSeen}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  ),
};

// Header label gallery — Figma `Arrow` axis variants (none /
// chevron-selector / down-arrow / up-arrow) shown in a single
// canvas so designers can verify pixel parity. RAC renders the
// chevron-selector when `allowsSorting` is set but no direction is
// active, and an `ArrowDown` (rotated 180° for ascending) when the
// column matches the table's `sortDescriptor`. The `sorted` column
// in this story shows the descending state.
export const HeaderLabelStates: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Header label states — plain / sortable (chevron) / sorted (arrow) / with tooltip / sorted + tooltip.',
      },
    },
  },
  args: { sortDescriptor: { column: 'sorted', direction: 'descending' as const } },
  render: (args) => (
    <Table {...args} aria-label="Header label states">
      <Table.Header>
        <Table.Head id="plain">
          <Table.HeadLabel>Plain label</Table.HeadLabel>
        </Table.Head>
        <Table.Head id="sortable" allowsSorting>
          <Table.HeadLabel>Sortable</Table.HeadLabel>
        </Table.Head>
        <Table.Head id="sorted" allowsSorting>
          <Table.HeadLabel>Sorted</Table.HeadLabel>
        </Table.Head>
        <Table.Head id="tooltip" tooltip="Inline help text — hover or focus to read.">
          <Table.HeadLabel>With tooltip</Table.HeadLabel>
        </Table.Head>
        <Table.Head id="combo" allowsSorting tooltip="Sortable column with extra context.">
          <Table.HeadLabel>Combo</Table.HeadLabel>
        </Table.Head>
      </Table.Header>
      <Table.Body>
        <Table.Row id="r1">
          <Table.Cell>—</Table.Cell>
          <Table.Cell>—</Table.Cell>
          <Table.Cell>—</Table.Cell>
          <Table.Cell>—</Table.Cell>
          <Table.Cell>—</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
  ),
};

export const WithSelection: Story = {
  args: { selectionMode: 'multiple' },
  render: (args) => (
    <Table {...args}>
      <Table.Header>
        <Table.Head id="name">Device</Table.Head>
        <Table.Head id="room">Room</Table.Head>
        <Table.Head id="status">Status</Table.Head>
      </Table.Header>
      <Table.Body>
        {devices.map((device) => (
          <Table.Row key={device.id} id={device.id}>
            <Table.Cell>
              <span className="font-medium text-primary">{device.name}</span>
            </Table.Cell>
            <Table.Cell>{device.room}</Table.Cell>
            <Table.Cell>{statusBadge(device.status)}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  ),
};

// Phase C empty-state — `<Table emptyState={…}>` auto-wires
// `renderEmptyState` on the body via context. `<Table.Empty>`
// ships the canonical Glaon layout (icon tile + title +
// description + optional action button).
export const Empty: Story = {
  render: (args) => (
    <Table
      {...args}
      emptyState={
        <Table.Empty
          title="No devices yet"
          description="Pair your first device to start automating."
        />
      }
    >
      <Table.Header>
        <Table.Head id="name">Device</Table.Head>
        <Table.Head id="room">Room</Table.Head>
        <Table.Head id="status">Status</Table.Head>
      </Table.Header>
      <Table.Body>{[]}</Table.Body>
    </Table>
  ),
};

// Empty state with action — domain-specific icon (`Users01`) +
// CTA button (`onPress`) shows the canonical "fix this" affordance
// for empty listings.
export const EmptyWithAction: Story = {
  render: (args) => (
    <Table
      {...args}
      aria-label="Team members"
      emptyState={
        <Table.Empty
          icon={Users01}
          title="No team members yet"
          description="Invite collaborators to start building together."
          action={{
            label: 'Invite member',
            icon: Plus,
            onPress: () => undefined,
          }}
        />
      }
    >
      <Table.Header>
        <Table.Head id="name">Name</Table.Head>
        <Table.Head id="role">Role</Table.Head>
        <Table.Head id="status">Status</Table.Head>
      </Table.Header>
      <Table.Body>{[]}</Table.Body>
    </Table>
  ),
};

// Custom empty-state node — pass any ReactNode to `emptyState` to
// bypass the default `<Table.Empty>` layout (e.g. when the empty
// case warrants an illustration or a multi-row layout the default
// can't express).
export const EmptyCustom: Story = {
  render: (args) => (
    <Table
      {...args}
      emptyState={
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <p className="text-2xl">🎉</p>
          <p className="text-md font-semibold text-primary">Inbox zero!</p>
          <p className="text-sm text-tertiary">
            Treat yourself &mdash; there&apos;s nothing to triage.
          </p>
        </div>
      }
    >
      <Table.Header>
        <Table.Head id="subject">Subject</Table.Head>
        <Table.Head id="from">From</Table.Head>
      </Table.Header>
      <Table.Body>{[]}</Table.Body>
    </Table>
  ),
};

export const Loading: Story = {
  render: (args) => (
    <Table {...args}>
      <Table.Header>
        <Table.Head id="name">Device</Table.Head>
        <Table.Head id="room">Room</Table.Head>
        <Table.Head id="status">Status</Table.Head>
        <Table.Head id="lastSeen">Last seen</Table.Head>
      </Table.Header>
      <Table.Body>
        {Array.from({ length: 5 }, (_, i) => (
          <Table.Row key={i} id={`skeleton-${i.toString()}`}>
            <Table.Cell>
              <div className="h-3 w-40 animate-pulse rounded bg-secondary" />
            </Table.Cell>
            <Table.Cell>
              <div className="h-3 w-24 animate-pulse rounded bg-secondary" />
            </Table.Cell>
            <Table.Cell>
              <div className="h-5 w-16 animate-pulse rounded-full bg-secondary" />
            </Table.Cell>
            <Table.Cell>
              <div className="h-3 w-20 animate-pulse rounded bg-secondary" />
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  ),
};

export const Compact: Story = {
  args: { size: 'sm' },
  render: (args) => (
    <Table {...args}>
      <Table.Header>
        <Table.Head id="name">Device</Table.Head>
        <Table.Head id="room">Room</Table.Head>
        <Table.Head id="status">Status</Table.Head>
      </Table.Header>
      <Table.Body>
        {devices.map((device) => (
          <Table.Row key={device.id} id={device.id}>
            <Table.Cell>
              <span className="font-medium text-primary">{device.name}</span>
            </Table.Cell>
            <Table.Cell>{device.room}</Table.Cell>
            <Table.Cell>{statusBadge(device.status)}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  ),
};

// === Phase A — cell-type sub-component catalog ============================
//
// Stories below exercise each `Table.Cell.*` sub-component shipped in
// #323 Phase A. The matrix story renders one row per cell type so
// designers can verify pixel parity against Figma's "Type" axis. Per-
// type stories surface the props in the controls panel for hands-on
// experimentation.

interface TeamRow {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'paused' | 'archived';
  rating: number;
  quota: number;
}

const team: TeamRow[] = [
  {
    id: '1',
    name: 'Olivia Rhye',
    email: 'olivia@untitledui.com',
    role: 'admin',
    status: 'active',
    rating: 5,
    quota: 92,
  },
  {
    id: '2',
    name: 'Phoenix Baker',
    email: 'phoenix@untitledui.com',
    role: 'editor',
    status: 'active',
    rating: 4,
    quota: 67,
  },
  {
    id: '3',
    name: 'Lana Steiner',
    email: 'lana@untitledui.com',
    role: 'viewer',
    status: 'paused',
    rating: 3,
    quota: 31,
  },
];

const roleColor = (role: TeamRow['role']) =>
  role === 'admin' ? 'brand' : role === 'editor' ? 'success' : 'gray';

export const CellTypesMatrix: Story = {
  parameters: {
    docs: {
      description: {
        story: 'One row per Phase A cell-type — direct pixel parity check against Figma.',
      },
    },
  },
  render: () => (
    <Table aria-label="Cell type catalog">
      <Table.Header>
        <Table.Head id="type">Cell type</Table.Head>
        <Table.Head id="example">Example</Table.Head>
      </Table.Header>
      <Table.Body>
        <Table.Row id="text">
          <Table.Cell>Text</Table.Cell>
          <Table.Cell>
            <Table.Cell.Text primary="Olivia Rhye" secondary="olivia@untitledui.com" />
          </Table.Cell>
        </Table.Row>
        <Table.Row id="avatar">
          <Table.Cell>Avatar</Table.Cell>
          <Table.Cell>
            <Table.Cell.Avatar primary="Phoenix Baker" secondary="phoenix@untitledui.com" />
          </Table.Cell>
        </Table.Row>
        <Table.Row id="badge">
          <Table.Cell>Badge</Table.Cell>
          <Table.Cell>
            <Table.Cell.Badge color="success">Online</Table.Cell.Badge>
          </Table.Cell>
        </Table.Row>
        <Table.Row id="badges-multiple">
          <Table.Cell>Badges multiple</Table.Cell>
          <Table.Cell>
            <Table.Cell.BadgesMultiple
              max={3}
              badges={[
                { label: 'Design', color: 'brand' },
                { label: 'Frontend', color: 'success' },
                { label: 'A11y', color: 'warning' },
                { label: 'Tooling' },
                { label: 'Mobile' },
              ]}
            />
          </Table.Cell>
        </Table.Row>
        <Table.Row id="trend-up">
          <Table.Cell>Trend (positive)</Table.Cell>
          <Table.Cell>
            <Table.Cell.Trend value="$45,231" delta="+12.5%" direction="positive" />
          </Table.Cell>
        </Table.Row>
        <Table.Row id="trend-down">
          <Table.Cell>Trend (negative)</Table.Cell>
          <Table.Cell>
            <Table.Cell.Trend value="$12,800" delta="−3.2%" direction="negative" />
          </Table.Cell>
        </Table.Row>
        <Table.Row id="progress">
          <Table.Cell>Progress</Table.Cell>
          <Table.Cell>
            <Table.Cell.Progress value={72} />
          </Table.Cell>
        </Table.Row>
        <Table.Row id="star-rating">
          <Table.Cell>Star rating</Table.Cell>
          <Table.Cell>
            <Table.Cell.StarRating value={4} />
          </Table.Cell>
        </Table.Row>
        <Table.Row id="action-buttons">
          <Table.Cell>Action buttons</Table.Cell>
          <Table.Cell>
            <Table.Cell.ActionButtons
              actions={[
                { label: 'Edit', onPress: () => undefined },
                { label: 'Delete', onPress: () => undefined, color: 'primary-destructive' },
              ]}
            />
          </Table.Cell>
        </Table.Row>
        <Table.Row id="action-icons">
          <Table.Cell>Action icons</Table.Cell>
          <Table.Cell>
            <Table.Cell.ActionIcons
              actions={[
                { icon: Eye, ariaLabel: 'View', onPress: () => undefined },
                { icon: Edit01, ariaLabel: 'Edit', onPress: () => undefined },
                { icon: Trash01, ariaLabel: 'Delete', onPress: () => undefined },
              ]}
            />
          </Table.Cell>
        </Table.Row>
        <Table.Row id="action-dropdown">
          <Table.Cell>Action dropdown</Table.Cell>
          <Table.Cell>
            <Table.Cell.ActionDropdown
              ariaLabel="Row actions"
              items={[
                { id: 'view', label: 'View', icon: Eye },
                { id: 'edit', label: 'Edit', icon: Edit01 },
                { id: 'delete', label: 'Delete', icon: Trash01 },
              ]}
            />
          </Table.Cell>
        </Table.Row>
        <Table.Row id="file-type">
          <Table.Cell>File type icon</Table.Cell>
          <Table.Cell>
            <Table.Cell.FileTypeIcon
              primary="design-tokens.json"
              secondary="2.4 KB · Edited 3h ago"
            />
          </Table.Cell>
        </Table.Row>
        <Table.Row id="payment">
          <Table.Cell>Payment icon</Table.Cell>
          <Table.Cell>
            <Table.Cell.PaymentIcon primary="Visa ending in 4242" secondary="Expires 06/27" />
          </Table.Cell>
        </Table.Row>
        <Table.Row id="avatar-group">
          <Table.Cell>Avatar group</Table.Cell>
          <Table.Cell>
            <Table.Cell.AvatarGroup
              avatars={[
                { alt: 'Olivia Rhye' },
                { alt: 'Phoenix Baker' },
                { alt: 'Lana Steiner' },
                { alt: 'Drew Cano' },
                { alt: 'Demi Wilkinson' },
              ]}
              max={3}
              total={8}
            />
          </Table.Cell>
        </Table.Row>
        <Table.Row id="select-dropdown">
          <Table.Cell>Select dropdown</Table.Cell>
          <Table.Cell>
            <Table.Cell.SelectDropdown
              ariaLabel="Role"
              defaultValue="editor"
              options={[
                { value: 'admin', label: 'Admin' },
                { value: 'editor', label: 'Editor' },
                { value: 'viewer', label: 'Viewer' },
              ]}
            />
          </Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
  ),
};

// Realistic team listing — composes Avatar + Badge + Progress +
// StarRating + ActionDropdown into a typical "team members" grid.
export const TeamMembers: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Team members listing — Avatar + Badge + Progress + ActionDropdown composed into a realistic row.',
      },
    },
  },
  render: () => (
    <Table aria-label="Team members" selectionMode="multiple">
      <Table.Header>
        <Table.Head id="name">Name</Table.Head>
        <Table.Head id="role">Role</Table.Head>
        <Table.Head id="status">Status</Table.Head>
        <Table.Head id="quota">Quota</Table.Head>
        <Table.Head id="rating">Rating</Table.Head>
        <Table.Head id="actions">
          {/* Visually hidden — the column reads "Actions" to screen
              readers but the visible header stays blank. axe
              `empty-table-header` rejects whitespace-only `<th>`s,
              and `aria-label` on the kit `<Column>` isn't forwarded
              onto the rendered header element. */}
          <span className="sr-only">Actions</span>
        </Table.Head>
      </Table.Header>
      <Table.Body>
        {team.map((member) => (
          <Table.Row key={member.id} id={member.id}>
            <Table.Cell>
              <Table.Cell.Avatar primary={member.name} secondary={member.email} />
            </Table.Cell>
            <Table.Cell>
              <Table.Cell.Badge color={roleColor(member.role)}>{member.role}</Table.Cell.Badge>
            </Table.Cell>
            <Table.Cell>
              <Table.Cell.SelectDropdown
                ariaLabel={`Status for ${member.name}`}
                defaultValue={member.status}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'paused', label: 'Paused' },
                  { value: 'archived', label: 'Archived' },
                ]}
              />
            </Table.Cell>
            <Table.Cell>
              <Table.Cell.Progress value={member.quota} />
            </Table.Cell>
            <Table.Cell>
              <Table.Cell.StarRating value={member.rating} />
            </Table.Cell>
            <Table.Cell>
              <Table.Cell.ActionDropdown
                ariaLabel={`Actions for ${member.name}`}
                items={[
                  { id: 'view', label: 'View profile', icon: Eye },
                  { id: 'edit', label: 'Edit role', icon: Edit01 },
                  { id: 'remove', label: 'Remove', icon: Trash01 },
                ]}
              />
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  ),
};

// Sales metrics example — Trend (±) + Progress combined for
// dashboard-style numeric grids.
export const SalesMetrics: Story = {
  render: () => (
    <Table aria-label="Sales by region">
      <Table.Header>
        <Table.Head id="region">Region</Table.Head>
        <Table.Head id="revenue">Revenue</Table.Head>
        <Table.Head id="growth">Growth</Table.Head>
        <Table.Head id="quota">Quota</Table.Head>
      </Table.Header>
      <Table.Body>
        <Table.Row id="emea">
          <Table.Cell>
            <Table.Cell.Text primary="EMEA" secondary="London HQ" />
          </Table.Cell>
          <Table.Cell>
            <Table.Cell.Trend value="$845,231" delta="+18.4%" direction="positive" />
          </Table.Cell>
          <Table.Cell>
            <Table.Cell.Trend value="312 clients" delta="+24" direction="positive" />
          </Table.Cell>
          <Table.Cell>
            <Table.Cell.Progress value={92} />
          </Table.Cell>
        </Table.Row>
        <Table.Row id="amer">
          <Table.Cell>
            <Table.Cell.Text primary="AMER" secondary="New York HQ" />
          </Table.Cell>
          <Table.Cell>
            <Table.Cell.Trend value="$1,204,608" delta="−2.3%" direction="negative" />
          </Table.Cell>
          <Table.Cell>
            <Table.Cell.Trend value="528 clients" delta="−12" direction="negative" />
          </Table.Cell>
          <Table.Cell>
            <Table.Cell.Progress value={78} />
          </Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
  ),
};

// === Phase D — lead action column ========================================
//
// `Table.LeadAction.{Checkbox|Radio|Toggle}` ships the three
// lead-column controls from Figma's `Table cell lead action` frame.
// The kit's `<Table selectionMode="multiple">` already handles the
// canonical multi-select checkbox column; reach for `LeadAction`
// when you need radio (single-select with the right glyph), toggle
// (per-row independent boolean state), or external state for the
// checkbox column.

interface IntegrationRow {
  id: string;
  name: string;
  description: string;
}

const integrations: IntegrationRow[] = [
  { id: 'github', name: 'GitHub', description: 'Sync issues + PRs as Glaon devices.' },
  { id: 'slack', name: 'Slack', description: 'Forward events to a channel.' },
  { id: 'pagerduty', name: 'PagerDuty', description: 'Page on-call when a device fails.' },
];

// `LeadAction.Toggle` — per-row independent boolean state.
// Canonical use case: feature flag / integration enable list.
export const WithToggleColumn: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Lead-column `<Switch>` for per-row enable / disable. Independent state per row — no group selection semantics.',
      },
    },
  },
  render: () => {
    const ToggleStory = () => {
      const [enabled, setEnabled] = useState(new Set(['github']));
      const toggle = (id: string) => {
        const next = new Set(enabled);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setEnabled(next);
      };
      return (
        <Table aria-label="Integrations">
          <Table.Header>
            <Table.Head id="enabled">
              <span className="sr-only">Enabled</span>
            </Table.Head>
            <Table.Head id="name">
              <Table.HeadLabel>Integration</Table.HeadLabel>
            </Table.Head>
            <Table.Head id="description">
              <Table.HeadLabel>Description</Table.HeadLabel>
            </Table.Head>
          </Table.Header>
          <Table.Body>
            {integrations.map((row) => (
              <Table.Row key={row.id} id={row.id}>
                <Table.Cell>
                  <Table.LeadAction.Toggle
                    value={enabled.has(row.id)}
                    onChange={() => {
                      toggle(row.id);
                    }}
                    ariaLabel={`Enable ${row.name}`}
                  />
                </Table.Cell>
                <Table.Cell>
                  <span className="font-medium text-primary">{row.name}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-tertiary">{row.description}</span>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      );
    };
    return <ToggleStory />;
  },
};

// `LeadAction.Radio` — single-select tables. Group radios across
// rows by sharing the same `name`.
export const WithRadioSelection: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Lead-column native radio. Picks exactly one row at a time; canonical "default config" selector pattern.',
      },
    },
  },
  render: () => {
    const RadioStory = () => {
      const [selected, setSelected] = useState('slack');
      return (
        <Table aria-label="Default integration">
          <Table.Header>
            <Table.Head id="selected">
              <span className="sr-only">Default</span>
            </Table.Head>
            <Table.Head id="name">
              <Table.HeadLabel>Integration</Table.HeadLabel>
            </Table.Head>
            <Table.Head id="description">
              <Table.HeadLabel>Description</Table.HeadLabel>
            </Table.Head>
          </Table.Header>
          <Table.Body>
            {integrations.map((row) => (
              <Table.Row key={row.id} id={row.id}>
                <Table.Cell>
                  <Table.LeadAction.Radio
                    name="default-integration"
                    formValue={row.id}
                    value={selected === row.id}
                    onChange={() => {
                      setSelected(row.id);
                    }}
                    ariaLabel={`Set ${row.name} as default`}
                  />
                </Table.Cell>
                <Table.Cell>
                  <span className="font-medium text-primary">{row.name}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-tertiary">{row.description}</span>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      );
    };
    return <RadioStory />;
  },
};

// `LeadAction.Checkbox` — externally-controlled checkbox column.
// Reach for it when RAC's built-in `selectionMode="multiple"` doesn't
// fit (e.g. server-paginated dataset where the selection set lives
// outside the table). For pure RAC selection prefer the kit prop.
export const WithCheckboxColumn: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Externally-controlled lead-column checkbox. Use when RAC `selectionMode="multiple"` doesn\'t fit (e.g. server-paginated rows where the selection set is owned by a query hook).',
      },
    },
  },
  render: () => {
    const CheckboxStory = () => {
      const [selected, setSelected] = useState(new Set(['github']));
      const toggle = (id: string) => {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelected(next);
      };
      return (
        <Table aria-label="Bulk-action integrations">
          <Table.Header>
            <Table.Head id="selected">
              <span className="sr-only">Select</span>
            </Table.Head>
            <Table.Head id="name">
              <Table.HeadLabel>Integration</Table.HeadLabel>
            </Table.Head>
            <Table.Head id="description">
              <Table.HeadLabel>Description</Table.HeadLabel>
            </Table.Head>
          </Table.Header>
          <Table.Body>
            {integrations.map((row) => (
              <Table.Row key={row.id} id={row.id}>
                <Table.Cell>
                  <Table.LeadAction.Checkbox
                    value={selected.has(row.id)}
                    onChange={() => {
                      toggle(row.id);
                    }}
                    ariaLabel={`Select ${row.name}`}
                  />
                </Table.Cell>
                <Table.Cell>
                  <span className="font-medium text-primary">{row.name}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-tertiary">{row.description}</span>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      );
    };
    return <CheckboxStory />;
  },
};
