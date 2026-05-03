// Action buttons cell — inline button row for per-row actions. Mirrors
// Figma "Type=Action buttons" cell. Use sparingly — too many inline
// actions crowd the grid; consider `ActionDropdownCell` for >2 items.

import type { MouseEventHandler } from 'react';

import { Button } from '../../Button';
import type { CellBaseProps, IconComponent } from './types';
import { joinClasses } from './types';

export interface ActionButtonsCellAction {
  /** Visible label. */
  label: string;
  /** Click handler. */
  onPress: MouseEventHandler<HTMLButtonElement>;
  /** Visual treatment. @default 'secondary' */
  color?: 'secondary' | 'tertiary' | 'primary-destructive';
  /** Optional leading icon. */
  iconLeading?: IconComponent;
  /** Disable this single button. */
  isDisabled?: boolean;
}

export interface ActionButtonsCellProps extends CellBaseProps {
  /** One row of buttons (typically 1–2 entries; use Dropdown for more). */
  actions: ActionButtonsCellAction[];
}

export function ActionButtonsCell({ actions, size = 'md', className }: ActionButtonsCellProps) {
  return (
    <div className={joinClasses('flex items-center gap-2', className)}>
      {actions.map((action, index) => {
        const buttonProps: Record<string, unknown> = {
          size: size === 'sm' ? 'sm' : 'md',
          color: action.color ?? 'secondary',
          onClick: action.onPress,
        };
        if (action.iconLeading !== undefined) buttonProps.iconLeading = action.iconLeading;
        if (action.isDisabled === true) buttonProps.isDisabled = true;
        return (
          <Button key={`${action.label}-${index.toString()}`} {...buttonProps}>
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}
