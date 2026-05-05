// Numbers (Apple Numbers) file glyph. Spreadsheet category — green band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function NumbersFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="NUM" bandColor={CATEGORY_BAND.spreadsheet} />;
}
