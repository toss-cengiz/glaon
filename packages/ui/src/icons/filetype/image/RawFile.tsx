// RAW image file glyph (camera RAW container — covers .raw, .cr2, .nef,
// .arw, .dng aliases). Image category — emerald band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function RawFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="RAW" bandColor={CATEGORY_BAND.image} />;
}
