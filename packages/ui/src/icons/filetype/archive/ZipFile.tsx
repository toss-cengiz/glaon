// ZIP archive file glyph. Archive category — red band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function ZipFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="ZIP" bandColor={CATEGORY_BAND.archive} />;
}
