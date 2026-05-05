// RTF (Rich Text Format) file glyph. Document category — blue band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function RtfFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="RTF" bandColor={CATEGORY_BAND.document} />;
}
