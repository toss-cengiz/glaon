// TXT (plain text) file glyph. Document category — blue band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function TxtFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="TXT" bandColor={CATEGORY_BAND.document} />;
}
