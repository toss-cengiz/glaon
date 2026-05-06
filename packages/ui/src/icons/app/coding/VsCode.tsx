// Visual Studio Code editor glyph. Multi-colour by brand spec — the
// blue ribbon silhouette is VSCode's identity, so the canonical
// fills are hard-coded and `currentColor` is ignored.

import type { AppIconProps } from '../types';

export function VsCode({ className, 'aria-hidden': ariaHidden = true, ...rest }: AppIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden={ariaHidden} className={className} {...rest}>
      <path
        fill="#0078D4"
        d="M22.05 2.86 17.3.62a1.46 1.46 0 0 0-1.66.28l-9.1 8.3-3.97-3.01a.97.97 0 0 0-1.24.06L.42 7.41a.97.97 0 0 0 0 1.43L3.86 12 .42 15.16a.97.97 0 0 0 0 1.43l.91.84c.34.32.86.36 1.24.06l3.97-3.01 9.1 8.3a1.46 1.46 0 0 0 1.66.28l4.75-2.24a1.46 1.46 0 0 0 .85-1.32V4.18a1.46 1.46 0 0 0-.85-1.32ZM18 17.07 11.13 12 18 6.93v10.14Z"
      />
    </svg>
  );
}
