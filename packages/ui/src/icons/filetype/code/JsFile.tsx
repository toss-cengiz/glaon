// JavaScript source file glyph. Code category — sky band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function JsFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="JS" bandColor={CATEGORY_BAND.code} />;
}
