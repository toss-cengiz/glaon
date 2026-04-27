// Glaon Popover — click-triggered, rich-content overlay primitive.
// UUI ships only a Select-specific `<Popover>` wrap (under
// `base/select/popover.tsx`) that hard-codes a trigger-width sizing
// and dropdown-style chrome. For the generic, click-to-open
// composition pattern this issue calls for, we hand-roll on top of
// react-aria-components' `<DialogTrigger>` + `<Popover>` +
// `<Dialog>` chain using kit surface vocabulary as canonical
// reference (`bg-primary` + `rounded-lg` + `shadow-lg` +
// `ring-secondary_alt`). RAC's portal placement (offset /
// crossOffset / placement / flip), focus return on close, escape
// close, and click-outside dismiss come for free.
//
// Usage:
//
//   <Popover>
//     <Popover.Trigger>
//       <Button>Open menu</Button>
//     </Popover.Trigger>
//     <Popover.Content placement="bottom start">
//       <div className="p-4">…rich content…</div>
//     </Popover.Content>
//   </Popover>

import type { ReactNode } from 'react';

import {
  DialogTrigger as AriaDialogTrigger,
  Dialog as AriaDialog,
  Popover as AriaPopover,
  type DialogTriggerProps as AriaDialogTriggerProps,
  type PopoverProps as AriaPopoverProps,
} from 'react-aria-components';

export interface PopoverProps extends AriaDialogTriggerProps {
  /** Trigger + content slots. Use `Popover.Trigger` and `Popover.Content`. */
  children: ReactNode;
}

export interface PopoverTriggerProps {
  /**
   * The focusable element that opens the popover. RAC's
   * `<DialogTrigger>` auto-wires the trigger's `aria-expanded` /
   * `aria-controls` against the popover.
   */
  children: ReactNode;
}

// Narrow `children` to plain `ReactNode` rather than the kit's
// `ChildrenOrFunction<PopoverRenderProps>` — the inner
// `<AriaDialog>` only accepts a `DialogRenderProps`-shaped function
// and the two signatures don't overlap. Glaon callers always pass
// static content; the popover's render-state hooks are still
// reachable via `<AriaPopover>` for any consumer that needs them.
export interface PopoverContentProps extends Omit<AriaPopoverProps, 'children'> {
  children: ReactNode;
}

function joinClasses(...parts: (string | undefined | false)[]): string {
  return parts.filter((p): p is string => Boolean(p)).join(' ');
}

function PopoverRoot({ children, ...rest }: PopoverProps) {
  return <AriaDialogTrigger {...rest}>{children}</AriaDialogTrigger>;
}

// `Popover.Trigger` is a passthrough — RAC's `<DialogTrigger>`
// recognises whichever focusable child is rendered first as the
// trigger, so we just forward children. Wrapping in a
// `<Fragment>`-like helper keeps the namespace symmetric with
// `<Popover.Content>` for application teams used to the Radix
// trigger / content split.
function PopoverTrigger({ children }: PopoverTriggerProps) {
  return <>{children}</>;
}

function PopoverContent({
  children,
  className,
  placement = 'bottom',
  offset = 8,
  ...rest
}: PopoverContentProps) {
  return (
    <AriaPopover
      placement={placement}
      offset={offset}
      {...rest}
      className={(state) =>
        joinClasses(
          'z-50 origin-(--trigger-anchor-point) overflow-hidden rounded-lg bg-primary shadow-lg ring-1 ring-secondary_alt outline-hidden will-change-transform',
          state.isEntering &&
            'duration-150 ease-out animate-in fade-in placement-top:slide-in-from-bottom-0.5 placement-bottom:slide-in-from-top-0.5 placement-left:slide-in-from-right-0.5 placement-right:slide-in-from-left-0.5',
          state.isExiting &&
            'duration-100 ease-in animate-out fade-out placement-top:slide-out-to-bottom-0.5 placement-bottom:slide-out-to-top-0.5 placement-left:slide-out-to-right-0.5 placement-right:slide-out-to-left-0.5',
          typeof className === 'function' ? className(state) : className,
        )
      }
    >
      <AriaDialog className="outline-hidden">{children}</AriaDialog>
    </AriaPopover>
  );
}

type PopoverNamespace = typeof PopoverRoot & {
  Trigger: typeof PopoverTrigger;
  Content: typeof PopoverContent;
};

export const Popover: PopoverNamespace = Object.assign(PopoverRoot, {
  Trigger: PopoverTrigger,
  Content: PopoverContent,
});
