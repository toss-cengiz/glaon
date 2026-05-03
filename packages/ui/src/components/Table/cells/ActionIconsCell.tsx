// Action icons cell — compact icon-only button row. Mirrors Figma
// "Type=Action icons" cell. Each icon must carry an `ariaLabel` so
// screen readers announce the action; axe `button-name` would
// otherwise flag the unnamed control.

import type { MouseEventHandler } from 'react';

import type { CellBaseProps, IconComponent } from './types';
import { joinClasses } from './types';

export interface ActionIconsCellAction {
  /** Icon component. */
  icon: IconComponent;
  /** Required accessible label (icon-only buttons need a name). */
  ariaLabel: string;
  /** Click handler. */
  onPress: MouseEventHandler<HTMLButtonElement>;
  /** Disable this icon. */
  isDisabled?: boolean;
}

export interface ActionIconsCellProps extends CellBaseProps {
  actions: ActionIconsCellAction[];
}

export function ActionIconsCell({ actions, size = 'md', className }: ActionIconsCellProps) {
  const buttonClass = joinClasses(
    'inline-flex shrink-0 items-center justify-center rounded-md text-fg-quaternary transition outline-focus-ring',
    'hover:bg-primary_hover hover:text-fg-quaternary_hover',
    'focus-visible:outline-2 focus-visible:outline-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    size === 'sm' ? 'size-7' : 'size-8',
  );
  const iconClass = size === 'sm' ? 'size-4' : 'size-5';
  return (
    <div className={joinClasses('flex items-center gap-1', className)}>
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <button
            key={`${action.ariaLabel}-${index.toString()}`}
            type="button"
            aria-label={action.ariaLabel}
            disabled={action.isDisabled}
            onClick={action.onPress}
            className={buttonClass}
          >
            <Icon className={iconClass} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
