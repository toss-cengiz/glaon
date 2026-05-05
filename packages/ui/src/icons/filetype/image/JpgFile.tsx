// JPG image file glyph. Image category — emerald band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function JpgFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="JPG" bandColor={CATEGORY_BAND.image} />;
}
