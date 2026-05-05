// Ruby source file glyph. Code category — sky band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function RbFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="RB" bandColor={CATEGORY_BAND.code} />;
}
