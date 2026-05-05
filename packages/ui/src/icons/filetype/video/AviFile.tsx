// AVI video file glyph. Video category — pink band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function AviFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="AVI" bandColor={CATEGORY_BAND.video} />;
}
