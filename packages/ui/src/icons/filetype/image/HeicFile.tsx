// HEIC image file glyph. Image category — emerald band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function HeicFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="HEIC" bandColor={CATEGORY_BAND.image} />;
}
