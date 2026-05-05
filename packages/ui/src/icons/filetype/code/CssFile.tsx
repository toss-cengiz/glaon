// CSS file glyph. Code category — sky band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function CssFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="CSS" bandColor={CATEGORY_BAND.code} />;
}
