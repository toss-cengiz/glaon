// Glaon Modal — focus-trapped, scroll-locked, backdrop overlay. The
// kit ships `application/modals/modal.tsx` as a thin re-styling of
// react-aria-components' `<ModalOverlay>` + `<Modal>` + `<Dialog>` +
// `<DialogTrigger>` chain (backdrop + zoom-in animations + responsive
// sizing). Glaon composes those kit primitives into a Trigger /
// Content / Header / Body / Footer slot pattern with optional
// FeaturedIcon / Title / Description / CloseButton slots so consumers
// can drop a complete modal in inline:
//
//   <Modal>
//     <Modal.Trigger>
//       <Button>Open</Button>
//     </Modal.Trigger>
//     <Modal.Content size="md">
//       <Modal.CloseButton />
//       <Modal.Header>
//         <Modal.FeaturedIcon color="success" theme="light" icon={CheckIcon} />
//         <Modal.Title>Confirm</Modal.Title>
//         <Modal.Description>Apply the change permanently?</Modal.Description>
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
// `aria-describedby` wiring on the dialog (driven by the
// `slot="title"` / `slot="description"` on Modal.Title /
// Modal.Description).

import { type ComponentProps, type FC, type ReactNode } from 'react';
import { X } from '@untitledui/icons';

import {
  Button as AriaButton,
  type DialogTriggerProps as AriaDialogTriggerProps,
  Heading as AriaHeading,
  type ModalOverlayProps as AriaModalOverlayProps,
  Text as AriaText,
} from 'react-aria-components';

import { FeaturedIcon as KitFeaturedIcon } from '../foundations/featured-icon/featured-icon';
import {
  Dialog as KitDialog,
  DialogTrigger as KitDialogTrigger,
  Modal as KitModal,
  ModalOverlay as KitModalOverlay,
} from '../application/modals/modal';
import { cx } from '../../utils/cx';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
type ModalFooterAlign = 'right' | 'between' | 'center' | 'stacked';

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
  /**
   * Action layout.
   * - `right` (default) — secondary then primary, right-aligned.
   * - `between` — secondary on the left, primary on the right
   *   (typical for "Back" + "Continue" pairs).
   * - `center` — actions centred (used with featured-icon-top
   *   patterns).
   * - `stacked` — actions stretched to full width and stacked
   *   vertically (mobile-first).
   */
  align?: ModalFooterAlign;
  children: ReactNode;
}

interface ModalTitleProps {
  /** Optional Tailwind override; replaces nothing of the default styling. */
  className?: string;
  children: ReactNode;
}

interface ModalDescriptionProps {
  className?: string;
  children: ReactNode;
}

interface ModalCloseButtonProps {
  /** Override the default `Close` aria-label (e.g. for translation). */
  'aria-label'?: string;
  className?: string;
}

interface ModalFeaturedIconProps {
  /** Icon component or element rendered inside the chip. */
  icon: FC<{ className?: string }> | ReactNode;
  /** @default 'lg' (matches the typical Modal Header proportions) */
  size?: ComponentProps<typeof KitFeaturedIcon>['size'];
  /** @default 'brand' */
  color?: ComponentProps<typeof KitFeaturedIcon>['color'];
  /** @default 'light' */
  theme?: ComponentProps<typeof KitFeaturedIcon>['theme'];
  className?: string;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-3xl',
  full: 'sm:max-w-[min(100vw-4rem,80rem)]',
};

const footerAlignStyles: Record<ModalFooterAlign, string> = {
  right: 'flex justify-end gap-3',
  between: 'flex justify-between gap-3',
  center: 'flex justify-center gap-3',
  // `[&>*]:flex-1` stretches direct button children to equal columns
  // for the stacked layout's mobile-first equal-width pair.
  stacked: 'flex flex-col gap-2 [&>*]:w-full',
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
            'relative rounded-xl bg-primary shadow-2xl ring-1 ring-secondary_alt',
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
        'flex flex-col gap-2 border-b border-secondary_alt px-6 pt-6 pb-4',
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

function ModalFooter({ className, align = 'right', children }: ModalFooterProps) {
  return (
    <div
      className={joinClasses(
        footerAlignStyles[align],
        'border-t border-secondary_alt px-6 pt-4 pb-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

// `Modal.Title` and `Modal.Description` map to RAC `<Heading slot="title">`
// and `<Text slot="description">`. RAC's `<Dialog>` reads those slots and
// forwards `aria-labelledby` + `aria-describedby` to the dialog
// container automatically — consumers don't need to wire them manually.
function ModalTitle({ className, children }: ModalTitleProps) {
  return (
    <AriaHeading slot="title" className={cx('text-lg font-semibold text-primary', className)}>
      {children}
    </AriaHeading>
  );
}

function ModalDescription({ className, children }: ModalDescriptionProps) {
  return (
    <AriaText slot="description" className={cx('text-sm text-tertiary', className)}>
      {children}
    </AriaText>
  );
}

// `Modal.CloseButton` renders a top-right X affordance that closes
// the dialog via RAC's `slot="close"` contract. Stays absolutely
// positioned inside `Modal.Content`'s `relative` container so it
// floats over the header without consuming layout space.
function ModalCloseButton({ 'aria-label': ariaLabel, className }: ModalCloseButtonProps) {
  return (
    <AriaButton
      slot="close"
      aria-label={ariaLabel ?? 'Close'}
      className={cx(
        'absolute top-4 right-4 z-10 inline-flex size-8 items-center justify-center rounded-md text-tertiary outline-none transition-colors',
        'hover:bg-primary_hover hover:text-secondary',
        'data-[focus-visible]:ring-2 data-[focus-visible]:ring-focus-ring',
        className,
      )}
    >
      <X aria-hidden="true" className="size-5" />
    </AriaButton>
  );
}

function ModalFeaturedIcon({
  icon,
  size = 'lg',
  color = 'brand',
  theme = 'light',
  className,
}: ModalFeaturedIconProps) {
  return (
    <KitFeaturedIcon
      icon={icon}
      size={size}
      color={color}
      theme={theme}
      className={cx('mb-1', className)}
    />
  );
}

type ModalNamespace = typeof ModalRoot & {
  Trigger: typeof ModalTrigger;
  Content: typeof ModalContent;
  Header: typeof ModalHeader;
  Body: typeof ModalBody;
  Footer: typeof ModalFooter;
  Title: typeof ModalTitle;
  Description: typeof ModalDescription;
  CloseButton: typeof ModalCloseButton;
  FeaturedIcon: typeof ModalFeaturedIcon;
};

export const Modal: ModalNamespace = Object.assign(ModalRoot, {
  Trigger: ModalTrigger,
  Content: ModalContent,
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
  Title: ModalTitle,
  Description: ModalDescription,
  CloseButton: ModalCloseButton,
  FeaturedIcon: ModalFeaturedIcon,
});
