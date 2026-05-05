// Go source file glyph. Code category — sky band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function GoFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="GO" bandColor={CATEGORY_BAND.code} />;
}
