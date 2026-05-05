// macOS DMG disk image glyph. Other category — gray band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function DmgFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="DMG" bandColor={CATEGORY_BAND.other} />;
}
