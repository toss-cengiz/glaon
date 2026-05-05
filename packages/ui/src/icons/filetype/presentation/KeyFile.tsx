// Keynote (Apple Keynote) file glyph. Presentation category —
// orange band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function KeyFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="KEY" bandColor={CATEGORY_BAND.presentation} />;
}
