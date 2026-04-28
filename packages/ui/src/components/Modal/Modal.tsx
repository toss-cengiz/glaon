// Glaon Modal — focus-trapped, scroll-locked, backdrop overlay. The
// kit ships `application/modals/modal.tsx` as a thin re-styling of
// react-aria-components' `<ModalOverlay>` + `<Modal>` + `<Dialog>` +
// `<DialogTrigger>` chain (backdrop + zoom-in animations + responsive
// sizing). Glaon composes those kit primitives into a Trigger /
// Content / Header / Body / Footer slot pattern so consumers can
// drop a complete modal in inline:
//
//   <Modal>
//     <Modal.Trigger>
//       <Button>Open</Button>
//     </Modal.Trigger>
//     <Modal.Content size="md">
//       <Modal.Header>
//         <h2>Confirm</h2>
//       </Modal.Header>
//       <Modal.Body>…content…</Modal.Body>
//       <Modal.Footer>
//         <Button color="secondary">Cancel</Button>
//         <Button color="primary">Save</Button>
//       </Modal.Footer>
//     </Modal.Content>
//   </Modal>
//
// The RAC foundation handles the full a11y contract: focus-trap +
// return on close, scroll lock on the backdrop, escape close,
// click-outside dismiss (when `isDismissable`), `aria-labelledby` /
// `aria-describedby` wiring on the dialog.

import type { ReactNode } from 'react';

import {
  type DialogTriggerProps as AriaDialogTriggerProps,
  type ModalOverlayProps as AriaModalOverlayProps,
} from 'react-aria-components';

import {
  Dialog as KitDialog,
  DialogTrigger as KitDialogTrigger,
  Modal as KitModal,
  ModalOverlay as KitModalOverlay,
} from '../application/modals/modal';

export type ModalSize = 'sm' | 'md' | 'lg' | 'full';

export interface ModalProps extends AriaDialogTriggerProps {
  /** Trigger + content slots. Use `Modal.Trigger` and `Modal.Content`. */
  children: ReactNode;
}

export interface ModalTriggerProps {
  /**
   * Focusable element that opens the modal. RAC's `<DialogTrigger>`
   * auto-wires `aria-expanded` + `aria-controls` against the dialog.
   */
  children: ReactNode;
}

export interface ModalContentProps extends Omit<AriaModalOverlayProps, 'children'> {
  /** Width preset; mirrors common dialog scales. @default 'md' */
  size?: ModalSize;
  /** Static body content. */
  children: ReactNode;
}

export interface ModalHeaderProps {
  className?: string;
  children: ReactNode;
}

export interface ModalBodyProps {
  className?: string;
  children: ReactNode;
}

export interface ModalFooterProps {
  className?: string;
  children: ReactNode;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-2xl',
  full: 'sm:max-w-[min(100vw-4rem,80rem)]',
};

function joinClasses(...parts: (string | undefined | false)[]): string {
  return parts.filter((p): p is string => Boolean(p)).join(' ');
}

function ModalRoot({ children, ...rest }: ModalProps) {
  return <KitDialogTrigger {...rest}>{children}</KitDialogTrigger>;
}

function ModalTrigger({ children }: ModalTriggerProps) {
  return <>{children}</>;
}

function ModalContent({ size = 'md', className, children, ...rest }: ModalContentProps) {
  return (
    <KitModalOverlay {...rest}>
      <KitModal
        className={(state) =>
          joinClasses(
            sizeStyles[size],
            'rounded-xl bg-primary shadow-2xl ring-1 ring-secondary_alt',
            // Reuse the kit's animations on the inner Modal node.
            state.isEntering && 'duration-300 ease-out animate-in zoom-in-95',
            state.isExiting && 'duration-200 ease-in animate-out zoom-out-95',
            typeof className === 'function' ? className(state) : className,
          )
        }
      >
        <KitDialog className="flex w-full flex-col p-0 outline-hidden">{children}</KitDialog>
      </KitModal>
    </KitModalOverlay>
  );
}

function ModalHeader({ className, children }: ModalHeaderProps) {
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

function ModalBody({ className, children }: ModalBodyProps) {
  // `tabIndex={0}` lets keyboard users focus the scrollable body and
  // page through with arrow keys — axe `scrollable-region-focusable`
  // requires this on every element that scrolls (the Body always
  // declares `overflow-y-auto`, so it qualifies even when content
  // fits within the height).
  return (
    <div tabIndex={0} className={joinClasses('flex-1 overflow-y-auto px-6 py-5', className)}>
      {children}
    </div>
  );
}

function ModalFooter({ className, children }: ModalFooterProps) {
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

type ModalNamespace = typeof ModalRoot & {
  Trigger: typeof ModalTrigger;
  Content: typeof ModalContent;
  Header: typeof ModalHeader;
  Body: typeof ModalBody;
  Footer: typeof ModalFooter;
};

export const Modal: ModalNamespace = Object.assign(ModalRoot, {
  Trigger: ModalTrigger,
  Content: ModalContent,
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
});
