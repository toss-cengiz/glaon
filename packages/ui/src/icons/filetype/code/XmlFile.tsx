// XML file glyph. Code category — sky band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function XmlFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="XML" bandColor={CATEGORY_BAND.code} />;
}
