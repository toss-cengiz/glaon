// File type icon cell — file extension glyph + filename + optional
// secondary line (size, modified date). Mirrors Figma "Type=File type
// icon" cell. The leading glyph today is a neutral file icon (`File02`)
// from `@untitledui/icons`; #309 Phase D ships per-extension artwork
// (PDF / DOCX / ZIP / …) and consumers can swap once that lands by
// passing an `extensionIcon` override.

import { File02 } from '@untitledui/icons';

import type { CellBaseProps, IconComponent } from './types';
import { joinClasses } from './types';

export interface FileTypeIconCellProps extends CellBaseProps {
  /** Filename. */
  primary: string;
  /** Secondary line (e.g. `2.4 MB · Edited 3h ago`). */
  secondary?: string;
  /**
   * Override the default file glyph with extension-specific artwork
   * (e.g. PDF / DOCX SVG components from #309 Phase D once shipped).
   */
  extensionIcon?: IconComponent;
}

export function FileTypeIconCell({
  primary,
  secondary,
  extensionIcon,
  size = 'md',
  className,
}: FileTypeIconCellProps) {
  const Icon = extensionIcon ?? File02;
  const iconBox = size === 'sm' ? 'size-8' : 'size-10';
  return (
    <div className={joinClasses('flex items-center gap-3', className)}>
      <span
        aria-hidden="true"
        className={joinClasses(
          'flex shrink-0 items-center justify-center rounded-md bg-secondary text-fg-quaternary',
          iconBox,
        )}
      >
        <Icon className={size === 'sm' ? 'size-5' : 'size-6'} />
      </span>
      <div className="flex flex-col">
        <span
          className={joinClasses(
            'truncate font-medium text-primary',
            size === 'sm' ? 'text-sm' : 'text-md',
          )}
        >
          {primary}
        </span>
        {secondary !== undefined ? (
          <span
            className={joinClasses('truncate text-tertiary', size === 'sm' ? 'text-xs' : 'text-sm')}
          >
            {secondary}
          </span>
        ) : null}
      </div>
    </div>
  );
}
