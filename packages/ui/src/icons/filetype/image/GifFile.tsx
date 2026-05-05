// GIF image file glyph. Image category — emerald band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function GifFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="GIF" bandColor={CATEGORY_BAND.image} />;
}
