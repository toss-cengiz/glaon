// PDF file glyph. Document category — blue band. Composes the
// shared `FileShape` primitive so the file silhouette stays
// consistent across every extension in the registry.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function PdfFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="PDF" bandColor={CATEGORY_BAND.document} />;
}
