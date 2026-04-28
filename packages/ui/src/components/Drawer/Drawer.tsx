// Glaon Drawer — edge-anchored, focus-trapped overlay (slide-in
// panel). Same RAC overlay primitives as Modal (P14) — no separate
// kit source ships for a generic drawer; the only kit "slide-out"
// templates are PRO application snippets with hard-coded content.
// Glaon hand-rolls the chrome using kit surface vocabulary
// (`bg-primary` + `shadow-2xl` + `ring-secondary_alt`) and
// composes RAC `<DialogTrigger>` + `<ModalOverlay>` + `<Modal>` +
// `<Dialog>` directly — RAC's animation primitives drive the
// slide-from-edge motion via Tailwind state hooks.
//
// Usage:
//
//   <Drawer>
//     <Drawer.Trigger>
//       <Button>Open settings</Button>
//     </Drawer.Trigger>
//     <Drawer.Content side="right" size="md">
//       <Drawer.Header>…</Drawer.Header>
//       <Drawer.Body>…</Drawer.Body>
//       <Drawer.Footer>…</Drawer.Footer>
//     </Drawer.Content>
//   </Drawer>
//
// The RAC foundation provides focus-trap + return on close, scroll
// lock on the backdrop, escape close, click-outside dismiss (when
// `isDismissable`), `aria-labelledby` / `aria-describedby` wiring
// on the inner dialog.

import type { ReactNode } from 'react';

import {
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  type DialogTriggerProps as AriaDialogTriggerProps,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
  type ModalOverlayProps as AriaModalOverlayProps,
} from 'react-aria-components';

export type DrawerSide = 'left' | 'right' | 'top' | 'bottom';
export type DrawerSize = 'sm' | 'md' | 'lg' | 'full';

export interface DrawerProps extends AriaDialogTriggerProps {
  /** Trigger + content slots. Use `Drawer.Trigger` and `Drawer.Content`. */
  children: ReactNode;
}

export interface DrawerTriggerProps {
  /**
   * Focusable element that opens the drawer. RAC's `<DialogTrigger>`
   * auto-wires `aria-expanded` + `aria-controls` against the dialog.
   */
  children: ReactNode;
}

export interface DrawerContentProps extends Omit<AriaModalOverlayProps, 'children'> {
  /** Edge to anchor the panel to. @default 'right' */
  side?: DrawerSide;
  /**
   * Cross-axis size: width for `left` / `right`, height for
   * `top` / `bottom`. `full` covers the entire viewport.
   * @default 'md'
   */
  size?: DrawerSize;
  /** Static panel content. */
  children: ReactNode;
}

export interface DrawerHeaderProps {
  className?: string;
  children: ReactNode;
}

export interface DrawerBodyProps {
  className?: string;
  children: ReactNode;
}

export interface DrawerFooterProps {
  className?: string;
  children: ReactNode;
}

// Tailwind class fragments per side. Position pins the panel to the
// edge; `slide-in-from-*` / `slide-out-to-*` drive entry / exit.
const sidePosition: Record<DrawerSide, string> = {
  left: 'inset-y-0 left-0 h-full max-h-screen',
  right: 'inset-y-0 right-0 h-full max-h-screen',
  top: 'inset-x-0 top-0 w-full',
  bottom: 'inset-x-0 bottom-0 w-full',
};

const sideEnter: Record<DrawerSide, string> = {
  left: 'slide-in-from-left',
  right: 'slide-in-from-right',
  top: 'slide-in-from-top',
  bottom: 'slide-in-from-bottom',
};

const sideExit: Record<DrawerSide, string> = {
  left: 'slide-out-to-left',
  right: 'slide-out-to-right',
  top: 'slide-out-to-top',
  bottom: 'slide-out-to-bottom',
};

// Per-side size: width for vertical sides, height for horizontal.
const sideSize: Record<DrawerSide, Record<DrawerSize, string>> = {
  left: {
    sm: 'w-72 max-w-[90vw]',
    md: 'w-96 max-w-[90vw]',
    lg: 'w-[32rem] max-w-[90vw]',
    full: 'w-screen',
  },
  right: {
    sm: 'w-72 max-w-[90vw]',
    md: 'w-96 max-w-[90vw]',
    lg: 'w-[32rem] max-w-[90vw]',
    full: 'w-screen',
  },
  top: {
    sm: 'h-48 max-h-[90vh]',
    md: 'h-72 max-h-[90vh]',
    lg: 'h-[28rem] max-h-[90vh]',
    full: 'h-screen',
  },
  bottom: {
    sm: 'h-48 max-h-[90vh]',
    md: 'h-72 max-h-[90vh]',
    lg: 'h-[28rem] max-h-[90vh]',
    full: 'h-screen',
  },
};

function joinClasses(...parts: (string | undefined | false)[]): string {
  return parts.filter((p): p is string => Boolean(p)).join(' ');
}

function DrawerRoot({ children, ...rest }: DrawerProps) {
  return <AriaDialogTrigger {...rest}>{children}</AriaDialogTrigger>;
}

function DrawerTrigger({ children }: DrawerTriggerProps) {
  return <>{children}</>;
}

function DrawerContent({
  side = 'right',
  size = 'md',
  className,
  children,
  ...rest
}: DrawerContentProps) {
  return (
    <AriaModalOverlay
      {...rest}
      className={(state) =>
        joinClasses(
          'fixed inset-0 z-50 bg-overlay/70 backdrop-blur-[6px]',
          state.isEntering && 'duration-200 ease-out animate-in fade-in',
          state.isExiting && 'duration-150 ease-in animate-out fade-out',
        )
      }
    >
      <AriaModal
        className={(state) =>
          joinClasses(
            'fixed bg-primary shadow-2xl ring-1 ring-secondary_alt outline-hidden',
            sidePosition[side],
            sideSize[side][size],
            state.isEntering && `duration-300 ease-out animate-in ${sideEnter[side]}`,
            state.isExiting && `duration-200 ease-in animate-out ${sideExit[side]}`,
            typeof className === 'function' ? className(state) : className,
          )
        }
      >
        <AriaDialog className="flex h-full w-full flex-col outline-hidden">{children}</AriaDialog>
      </AriaModal>
    </AriaModalOverlay>
  );
}

function DrawerHeader({ className, children }: DrawerHeaderProps) {
  return (
    <div
      className={joinClasses(
        'flex flex-col gap-1 border-b border-secondary_alt px-6 pt-6 pb-4',
        className,
      )}
    >
      {children}
    </div>
  );
}

function DrawerBody({ className, children }: DrawerBodyProps) {
  // `tabIndex={0}` lets keyboard users focus the scrollable body and
  // page through with arrow keys — axe `scrollable-region-focusable`
  // requires this on every element that scrolls. Same fix as Modal.
  return (
    <div tabIndex={0} className={joinClasses('flex-1 overflow-y-auto px-6 py-5', className)}>
      {children}
    </div>
  );
}

function DrawerFooter({ className, children }: DrawerFooterProps) {
  return (
    <div
      className={joinClasses(
        'flex justify-end gap-3 border-t border-secondary_alt px-6 pt-4 pb-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

type DrawerNamespace = typeof DrawerRoot & {
  Trigger: typeof DrawerTrigger;
  Content: typeof DrawerContent;
  Header: typeof DrawerHeader;
  Body: typeof DrawerBody;
  Footer: typeof DrawerFooter;
};

export const Drawer: DrawerNamespace = Object.assign(DrawerRoot, {
  Trigger: DrawerTrigger,
  Content: DrawerContent,
  Header: DrawerHeader,
  Body: DrawerBody,
  Footer: DrawerFooter,
});
