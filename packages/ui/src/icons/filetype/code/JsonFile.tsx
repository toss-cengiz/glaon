// JSON file glyph. Code category — sky band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function JsonFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="JSON" bandColor={CATEGORY_BAND.code} />;
}
