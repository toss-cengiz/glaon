// Action dropdown cell — `…` trigger that opens a menu of row actions.
// Mirrors Figma "Type=Action dropdown icon" cell. Use when a row
// surfaces 3+ actions (when 2 fit, prefer `ActionButtonsCell` so
// users don't need a click to discover the affordance).

import { Dropdown } from '../../Dropdown';
import type { CellBaseProps, IconComponent } from './types';
import { joinClasses } from './types';

export interface ActionDropdownCellItem {
  /** Stable id for the menu item. */
  id: string;
  /** Visible label. */
  label: string;
  /** Optional leading icon. */
  icon?: IconComponent;
  /**
   * Action handler. The kit Dropdown forwards the menu's
   * `onAction(id)`; this wrap calls back per-item so consumers
   * don't need to switch on `id` themselves.
   */
  onPress?: () => void;
  /** Render a separator before this item. */
  separatorBefore?: boolean;
}

export interface ActionDropdownCellProps extends CellBaseProps {
  /** Required accessible label for the trigger button. */
  ariaLabel: string;
  /** Menu items in display order. */
  items: ActionDropdownCellItem[];
}

export function ActionDropdownCell({
  ariaLabel,
  items,
  size = 'md',
  className,
}: ActionDropdownCellProps) {
  const handleAction = (id: React.Key) => {
    const match = items.find((item) => item.id === id);
    match?.onPress?.();
  };

  return (
    <div className={joinClasses('flex items-center justify-end', className)}>
      <Dropdown>
        <Dropdown.DotsButton
          aria-label={ariaLabel}
          className={size === 'sm' ? 'size-7' : 'size-8'}
        />
        <Dropdown.Popover>
          <Dropdown.Menu onAction={handleAction}>
            {items.map((item) => {
              const itemProps: Record<string, unknown> = {
                id: item.id,
                label: item.label,
              };
              if (item.icon !== undefined) itemProps.icon = item.icon;
              return <Dropdown.Item key={item.id} {...itemProps} />;
            })}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
}
