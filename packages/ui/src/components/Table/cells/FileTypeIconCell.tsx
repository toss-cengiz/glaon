// File type icon cell — file extension glyph + filename + optional
// secondary line (size, modified date). Mirrors Figma "Type=File type
// icon" cell. The cell auto-detects the extension from the filename
// and routes to the per-extension artwork via the file-type registry's
// `fileTypeIconForExtension` helper (#370 D.4.a). When the extension
// isn't covered, falls back to the kit's neutral `File02`. Consumers
// can override the auto-detection via the `extensionIcon` prop.

import { File02 } from '@untitledui/icons';

import { fileTypeIconForExtension } from '../../../icons/filetype';
import type { CellBaseProps, IconComponent } from './types';
import { joinClasses } from './types';

export interface FileTypeIconCellProps extends CellBaseProps {
  /** Filename — the trailing extension drives the auto-glyph swap. */
  primary: string;
  /** Secondary line (e.g. `2.4 MB · Edited 3h ago`). */
  secondary?: string;
  /**
   * Override the auto-detected glyph with a specific component.
   * Useful when the filename doesn't carry the extension (e.g.
   * server-side metadata) or to force a specific look against the
   * filename's actual extension.
   */
  extensionIcon?: IconComponent;
}

function extractExtension(filename: string): string | undefined {
  const dot = filename.lastIndexOf('.');
  if (dot === -1 || dot === filename.length - 1) return undefined;
  return filename.slice(dot + 1);
}

export function FileTypeIconCell({
  primary,
  secondary,
  extensionIcon,
  size = 'md',
  className,
}: FileTypeIconCellProps) {
  // Resolution order: explicit override > registry auto-detect >
  // kit-neutral `File02` fallback.
  const ext = extractExtension(primary);
  const RegistryIcon = ext !== undefined ? fileTypeIconForExtension(ext) : undefined;
  const Icon = extensionIcon ?? RegistryIcon ?? File02;
  const iconBox = size === 'sm' ? 'size-8' : 'size-10';
  // Registry glyphs ship their own colored band + file silhouette,
  // so they don't need the neutral background tile that wraps the
  // fallback `File02` glyph. Strip the tile when we're rendering a
  // registry glyph.
  const isRegistryGlyph = Icon !== File02 && extensionIcon === undefined;
  return (
    <div className={joinClasses('flex items-center gap-3', className)}>
      {isRegistryGlyph ? (
        <span aria-hidden="true" className={joinClasses('flex shrink-0', iconBox)}>
          <Icon className={size === 'sm' ? 'h-8' : 'h-10'} />
        </span>
      ) : (
        <span
          aria-hidden="true"
          className={joinClasses(
            'flex shrink-0 items-center justify-center rounded-md bg-secondary text-fg-quaternary',
            iconBox,
          )}
        >
          <Icon className={size === 'sm' ? 'size-5' : 'size-6'} />
        </span>
      )}
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
