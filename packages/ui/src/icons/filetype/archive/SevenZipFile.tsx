// 7z archive file glyph. Archive category — red band.
// Component name is `SevenZipFile` because identifiers can't begin
// with a digit; the catalog id stays `7z` for extension matching.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function SevenZipFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="7Z" bandColor={CATEGORY_BAND.archive} />;
}
