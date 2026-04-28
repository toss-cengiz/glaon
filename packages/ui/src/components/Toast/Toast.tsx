// Glaon Toast — transient feedback overlay. UUI ships only the
// visual `AlertFloating` (`application/alerts/alerts.tsx`); the queue
// + stack + portal + auto-dismiss + viewport positioning are not
// provided by the kit. Glaon hand-rolls a minimal but complete
// queue API on top — `Toast` (visual card), `ToastProvider` (mounts
// the portal + tracks the queue), and `useToast()` (the consumer
// hook). The visual chrome is anchored on the kit's `AlertFloating`
// class structure (`bg-primary_alt` + `rounded-xl` + `shadow-xs`),
// just parameterized through props.
//
// A11y notes:
// - Each toast carries `role="status"` + `aria-live="polite"` so
//   screen readers announce on insert.
// - `aria-atomic="true"` ensures the full title + description text
//   gets announced as one update, not piecemeal.
// - Action button + close button are real `<button>` elements; both
//   are keyboard reachable when the toast renders.
// - Persistent toasts (no auto-dismiss) respect the same focus rules.
//
// Phase 1 scope: ToastProvider lives at the consumer's tree root
// (typical `apps/web/src/main.tsx` mount post-Phase-2). Storybook
// gets a global decorator so stories can call `useToast()` without
// extra wiring.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import { AlertCircle, AlertTriangle, CheckCircle, InfoCircle } from '@untitledui/icons';

export type ToastIntent = 'info' | 'success' | 'warning' | 'danger';

export interface ToastAction {
  /** Button label rendered next to the toast text. */
  label: string;
  /** Click handler. The toast auto-dismisses after the action fires. */
  onPress: () => void;
}

export interface ToastProps {
  /** Bold first line. */
  title: ReactNode;
  /** Secondary description rendered under the title. */
  description?: ReactNode;
  /** Severity / colour group for the leading icon. @default 'info' */
  intent?: ToastIntent;
  /** Optional CTA button rendered on the right. */
  action?: ToastAction;
  /** Hide the close button. @default false */
  hideClose?: boolean;
  /**
   * Auto-dismiss delay in ms. Set to `0` (or omit) to require manual
   * dismissal. @default 5000
   */
  duration?: number;
  /** Fires when the toast is dismissed (auto, action, or close). */
  onDismiss?: () => void;
}

interface ToastEntry extends ToastProps {
  id: string;
}

// Workaround for `@untitledui/icons` importing without standalone
// `.d.ts` files — same trick as `Alert.tsx` / `Stat.tsx`.
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see comment above
type IconComponent = FC<any>;

const intentIcon: Record<ToastIntent, IconComponent> = {
  info: InfoCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  danger: AlertCircle,
};

const intentIconColor: Record<ToastIntent, string> = {
  info: 'text-fg-brand-primary_alt',
  success: 'text-fg-success-primary',
  warning: 'text-fg-warning-primary',
  danger: 'text-fg-error-primary',
};

interface ToastContextValue {
  show: (toast: ToastProps) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Read the toast queue API. Must be used inside a `<ToastProvider>`.
 * Returns `{ show, dismiss }` — `show` returns the toast id for
 * imperative dismiss / chaining.
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (ctx === null) {
    throw new Error('useToast() must be used inside <ToastProvider>');
  }
  return ctx;
}

/**
 * Mount once near the application root. Wraps children in the toast
 * queue context and renders a fixed-positioned stack via `createPortal`
 * (top-right of the viewport, stacking downward).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((toast: ToastProps) => {
    const id = `toast-${Date.now().toString()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted
        ? createPortal(
            <div
              aria-live="polite"
              className="pointer-events-none fixed top-4 right-4 z-50 flex flex-col gap-3"
            >
              {toasts.map((entry) => (
                <Toast
                  key={entry.id}
                  {...entry}
                  onDismiss={() => {
                    entry.onDismiss?.();
                    dismiss(entry.id);
                  }}
                />
              ))}
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

function joinClasses(...parts: (string | undefined | false)[]): string {
  return parts.filter((p): p is string => Boolean(p)).join(' ');
}

/**
 * Standalone Toast card. Useful for Storybook stories that want to
 * render a frozen toast without wiring `useToast()`. Production code
 * should call `useToast().show()` instead so the queue manages the
 * lifecycle.
 */
export function Toast({
  title,
  description,
  intent = 'info',
  action,
  hideClose = false,
  duration = 5000,
  onDismiss,
}: ToastProps) {
  const Icon = intentIcon[intent];
  const iconColor = intentIconColor[intent];

  // Auto-dismiss timer. `duration` of 0 means "manual dismiss only".
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (duration <= 0) return undefined;
    timerRef.current = setTimeout(() => {
      onDismiss?.();
    }, duration);
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [duration, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={joinClasses(
        'pointer-events-auto relative flex w-96 max-w-[calc(100vw-2rem)] gap-3 rounded-xl bg-primary_alt p-4 shadow-lg ring-1 ring-secondary_alt',
      )}
    >
      <Icon aria-hidden="true" className={`size-5 shrink-0 ${iconColor}`} />
      <div className="flex flex-1 flex-col gap-1 overflow-hidden">
        <p className="pr-8 text-sm font-semibold text-secondary">{title}</p>
        {description !== undefined ? <p className="text-sm text-tertiary">{description}</p> : null}
        {action !== undefined ? (
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={() => {
                action.onPress();
                onDismiss?.();
              }}
              className="text-sm font-semibold text-fg-brand-primary_alt outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {action.label}
            </button>
          </div>
        ) : null}
      </div>
      {!hideClose ? (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="absolute top-3 right-3 rounded-md p-1 text-fg-quaternary outline-focus-ring transition hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <span aria-hidden="true" className="block h-4 w-4 leading-none">
            ×
          </span>
        </button>
      ) : null}
    </div>
  );
}
