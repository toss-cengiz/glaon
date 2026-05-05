// FLAC audio file glyph. Audio category — purple band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function FlacFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="FLAC" bandColor={CATEGORY_BAND.audio} />;
}
