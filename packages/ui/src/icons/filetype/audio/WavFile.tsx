// WAV audio file glyph. Audio category — purple band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function WavFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="WAV" bandColor={CATEGORY_BAND.audio} />;
}
