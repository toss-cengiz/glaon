// AAC audio file glyph. Audio category — purple band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function AacFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="AAC" bandColor={CATEGORY_BAND.audio} />;
}
