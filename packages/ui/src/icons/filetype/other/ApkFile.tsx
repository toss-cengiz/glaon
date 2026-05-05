// Android APK package glyph. Other category — gray band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function ApkFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="APK" bandColor={CATEGORY_BAND.other} />;
}
