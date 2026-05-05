// Windows EXE binary glyph. Other category — gray band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function ExeFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="EXE" bandColor={CATEGORY_BAND.other} />;
}
