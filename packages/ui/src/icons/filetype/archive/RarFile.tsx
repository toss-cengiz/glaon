// RAR archive file glyph. Archive category — red band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function RarFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="RAR" bandColor={CATEGORY_BAND.archive} />;
}
