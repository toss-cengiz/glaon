// YAML file glyph (covers .yaml + .yml). Code category — sky band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function YamlFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="YAML" bandColor={CATEGORY_BAND.code} />;
}
