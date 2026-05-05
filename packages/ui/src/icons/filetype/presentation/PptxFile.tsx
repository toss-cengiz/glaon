// PPTX (PowerPoint) file glyph. Presentation category — orange band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function PptxFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="PPTX" bandColor={CATEGORY_BAND.presentation} />;
}
