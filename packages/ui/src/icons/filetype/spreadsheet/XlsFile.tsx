// XLS (legacy Excel) file glyph. Spreadsheet category — green band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function XlsFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="XLS" bandColor={CATEGORY_BAND.spreadsheet} />;
}
