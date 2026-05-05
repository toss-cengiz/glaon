// SVG image file glyph. Image category — emerald band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function SvgFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="SVG" bandColor={CATEGORY_BAND.image} />;
}
