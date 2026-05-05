// Pages (Apple Pages) file glyph. Document category — blue band.

import { CATEGORY_BAND, FileShape } from '../_shape';
import type { FileTypeIconProps } from '../types';

export function PagesFile(props: FileTypeIconProps) {
  return <FileShape {...props} extension="PAGES" bandColor={CATEGORY_BAND.document} />;
}
