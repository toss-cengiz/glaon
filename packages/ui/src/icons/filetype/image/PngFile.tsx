// PNG image file glyph. Image category — emerald band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function PngFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="PNG" bandColor={CATEGORY_BAND.image} />;
}
