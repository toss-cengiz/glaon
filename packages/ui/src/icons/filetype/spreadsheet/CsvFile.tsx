// CSV (comma-separated values) file glyph. Spreadsheet category —
// green band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function CsvFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="CSV" bandColor={CATEGORY_BAND.spreadsheet} />;
}
