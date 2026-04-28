import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

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
          Device
        </Table.Head>
        <Table.Head id="room" allowsSorting>
          Room
        </Table.Head>
        <Table.Head id="status">Status</Table.Head>
        <Table.Head id="lastSeen" allowsSorting>
          Last seen
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

export const Empty: Story = {
  render: (args) => (
    <Table {...args}>
      <Table.Header>
        <Table.Head id="name">Device</Table.Head>
        <Table.Head id="room">Room</Table.Head>
        <Table.Head id="status">Status</Table.Head>
      </Table.Header>
      <Table.Body
        renderEmptyState={() => (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <p className="text-base font-semibold text-primary">No devices yet</p>
            <p className="text-sm text-tertiary">Pair your first device to start automating.</p>
          </div>
        )}
      >
        {[]}
      </Table.Body>
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
