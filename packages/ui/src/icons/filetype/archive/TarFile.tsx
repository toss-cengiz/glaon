// TAR archive file glyph (covers .tar, .tar.gz, .tgz aliases).
// Archive category — red band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function TarFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="TAR" bandColor={CATEGORY_BAND.archive} />;
}
