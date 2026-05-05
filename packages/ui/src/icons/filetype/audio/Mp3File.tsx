// MP3 audio file glyph. Audio category — purple band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function Mp3File(props: FileTypeIconProps) {
  return <FileShape {...props} extension="MP3" bandColor={CATEGORY_BAND.audio} />;
}
