// MP4 video file glyph. Video category — pink band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function Mp4File(props: FileTypeIconProps) {
  return <FileShape {...props} extension="MP4" bandColor={CATEGORY_BAND.video} />;
}
