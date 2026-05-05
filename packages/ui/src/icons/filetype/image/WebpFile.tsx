// WEBP image file glyph. Image category — emerald band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function WebpFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="WEBP" bandColor={CATEGORY_BAND.image} />;
}
