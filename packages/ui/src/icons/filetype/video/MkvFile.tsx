// MKV (Matroska) video file glyph. Video category — pink band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function MkvFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="MKV" bandColor={CATEGORY_BAND.video} />;
}
