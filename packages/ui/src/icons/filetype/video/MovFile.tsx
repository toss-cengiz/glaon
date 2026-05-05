// MOV video file glyph. Video category — pink band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function MovFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="MOV" bandColor={CATEGORY_BAND.video} />;
}
