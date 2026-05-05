// TypeScript source file glyph. Code category — sky band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function TsFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="TS" bandColor={CATEGORY_BAND.code} />;
}
