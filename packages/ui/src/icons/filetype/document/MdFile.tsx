// MD (Markdown) file glyph. Document category — blue band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function MdFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="MD" bandColor={CATEGORY_BAND.document} />;
}
