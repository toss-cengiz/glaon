// DOCX (Word) file glyph. Document category — blue band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function DocxFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="DOCX" bandColor={CATEGORY_BAND.document} />;
}
