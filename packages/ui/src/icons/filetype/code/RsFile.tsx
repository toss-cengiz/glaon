// Rust source file glyph. Code category — sky band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function RsFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="RS" bandColor={CATEGORY_BAND.code} />;
}
