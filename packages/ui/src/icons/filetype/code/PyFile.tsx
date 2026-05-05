// Python source file glyph. Code category — sky band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function PyFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="PY" bandColor={CATEGORY_BAND.code} />;
}
