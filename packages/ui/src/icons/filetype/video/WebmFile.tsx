// WEBM video file glyph. Video category — pink band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function WebmFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="WEBM" bandColor={CATEGORY_BAND.video} />;
}
