// XLSX (Excel) file glyph. Spreadsheet category — green band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function XlsxFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="XLSX" bandColor={CATEGORY_BAND.spreadsheet} />;
}
