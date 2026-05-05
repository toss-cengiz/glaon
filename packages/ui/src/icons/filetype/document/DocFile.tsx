// DOC (legacy Word) file glyph. Document category — blue band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function DocFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="DOC" bandColor={CATEGORY_BAND.document} />;
}
