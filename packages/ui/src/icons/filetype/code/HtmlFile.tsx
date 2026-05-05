// HTML file glyph. Code category — sky band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function HtmlFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="HTML" bandColor={CATEGORY_BAND.code} />;
}
