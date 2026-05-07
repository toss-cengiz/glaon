// IntelliJ IDEA editor glyph. The black square frame with the
// red/yellow/blue corner markers is the JetBrains family signature;
// canonical fills are hard-coded.

import type { AppIconProps } from '../types';

export function IntelliJ({ className, 'aria-hidden': ariaHidden = true, ...rest }: AppIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect x="2" y="2" width="20" height="20" rx="2" fill="#000000" />
      <path fill="#FE2857" d="m4.5 4 6 .5v3.4L4.5 7.4Z" />
      <path fill="#FCBE3C" d="m13.5 4.5 6 .5V8l-6-.4Z" />
      <path fill="#0AAFEF" d="M4.5 16.5 10.5 16v3.5l-6 .5Z" />
      <path
        fill="#FFFFFF"
        d="M9.4 6.6h1.1v8.5c0 1-.18 1.74-.55 2.21-.36.47-.95.7-1.77.7-.5 0-.93-.07-1.31-.22-.38-.14-.8-.39-1.27-.74l.62-.96c.4.27.74.46 1 .56.27.1.55.16.84.16.4 0 .69-.12.86-.36.17-.24.26-.69.26-1.34V6.6Zm6.85 0h-3.32v9.4h3.4c1.18 0 2.07-.27 2.65-.82.59-.55.88-1.4.88-2.55v-2.66c0-1.13-.29-1.97-.87-2.54-.59-.55-1.51-.83-2.74-.83Z"
      />
    </svg>
  );
}
