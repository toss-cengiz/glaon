// Glaon SetupLayout — page chrome for the first-run setup wizard
// (epic #533, ADR 0028). Sibling primitive to AuthLayout, not a variant —
// the chrome is materially different (vertical step rail on the left, no
// brand image, fixed footer with brand + contact).
//
// Pixel-matches Figma node `1277:791` (Design System / SETUP progress 01 /
// Desktop) at 1440px. The right-column content (form title / fields /
// CTAs) is the step component's responsibility, supplied via `children`.
//
// SetupLayout is purely presentational — no async state, no ConfigStore
// reads, no router knowledge. SetupRoute (#539) owns the state machine
// and feeds the active step's component into `children`.
//
// The inline step navigator below is intentionally minimal: it renders
// only the two states the existing Figma frame draws (active = full
// opacity text; upcoming = 50% opacity text). #538 extracts this into a
// dedicated `SetupStepNav` primitive that adds the `completed` state
// once D2–D5 land.

import type { ReactNode } from 'react';

import { Logo } from '../Logo';

export interface SetupLayoutStep {
  /** Stable identifier; matched against `activeStepId` to mark this row active. */
  id: string;
  /**
   * Icon node rendered inside the 40×40 featured-icon container. Typically a
   * UUI 20×20 outline icon — the container handles bg, border, and shadow.
   */
  icon: ReactNode;
  /** Bold title — Inter Semi Bold, text-sm, neutral-700 (text-secondary). */
  title: string;
  /** Optional descriptive line under the title — Inter Regular, text-sm, neutral-600 (text-tertiary). */
  description?: string;
}

export interface SetupLayoutProps {
  /** Ordered list of wizard steps rendered in the left rail. */
  steps: readonly SetupLayoutStep[];
  /**
   * Id of the active step. The matching row renders at full opacity; every
   * other row renders at 50% opacity (matches Figma `opacity-50` on the
   * text block, icon stays full opacity).
   */
  activeStepId: string;
  /**
   * Override for the brand logo at the top-left of the sidebar. Defaults to
   * `<Logo size={133} />` (matches Figma's 133×60 wordmark). Pass `null` to
   * suppress.
   */
  logoSlot?: ReactNode;
  /**
   * Override for the sidebar footer. Defaults to `© Glaon {year}` on the
   * left and `help@glaon.com` on the right (with the UUI mail icon). Pass
   * `null` to suppress.
   */
  footerSlot?: ReactNode;
  /**
   * Right-column content. Step components render their own header, form,
   * and CTAs here — SetupLayout does not impose padding so the step can
   * pick its own gutter (the Figma frame uses generous internal padding
   * that varies per step).
   */
  children?: ReactNode;
}

export function SetupLayout({
  steps,
  activeStepId,
  logoSlot,
  footerSlot,
  children,
}: SetupLayoutProps) {
  // `logoSlot === undefined` → render the default. `logoSlot === null` →
  // suppress entirely. Same distinction as AuthLayout (the AuthLayout
  // pattern documents why this matters for Storybook controls panels).
  const logo = logoSlot === undefined ? <Logo size={133} /> : logoSlot;
  const footer =
    footerSlot === undefined ? <DefaultSetupFooter year={new Date().getFullYear()} /> : footerSlot;

  return (
    <div className="flex min-h-screen flex-col bg-primary lg:h-screen lg:min-h-0 lg:flex-row lg:overflow-hidden">
      <aside
        className="flex flex-col justify-between bg-[var(--glaon-light-grey)] lg:h-full lg:w-full lg:max-w-[384px] lg:shrink-0"
        aria-label="Setup wizard navigation"
      >
        <div className="flex flex-col gap-16 px-8 pt-8">
          {logo !== null && <div className="h-[60px] w-[133px]">{logo}</div>}
          <SetupStepNav steps={steps} activeStepId={activeStepId} />
        </div>
        {footer !== null && (
          <div className="flex h-24 items-end justify-between p-8 text-sm text-tertiary">
            {footer}
          </div>
        )}
      </aside>
      <main className="flex flex-1 flex-col lg:min-w-[480px] lg:overflow-y-auto">{children}</main>
    </div>
  );
}

interface SetupStepNavProps {
  readonly steps: readonly SetupLayoutStep[];
  readonly activeStepId: string;
}

/**
 * Minimal inline navigator that ships with the layout for #537. #538
 * replaces this with a dedicated `SetupStepNav` primitive that exposes
 * its own props / stories / completed state. Until then this is the
 * single source of truth for the rail markup.
 */
function SetupStepNav({ steps, activeStepId }: SetupStepNavProps) {
  return (
    <nav aria-label="Wizard progress" className="w-[320px]">
      <ol className="flex flex-col">
        {steps.map((step, index) => {
          const isActive = step.id === activeStepId;
          const isLast = index === steps.length - 1;
          return (
            <li key={step.id} className="flex items-start gap-3">
              {/* Left rail: icon + connector */}
              <div className="flex flex-col items-center self-stretch gap-1 pb-1">
                <div className="z-[1] flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-secondary shadow-xs-skeuomorphic ring-1 ring-primary ring-inset">
                  <span aria-hidden="true" className="block size-5">
                    {step.icon}
                  </span>
                </div>
                {!isLast && <div className="w-px flex-1 bg-[var(--color-neutral-300)]" />}
              </div>
              {/* Right column: text block.
               *
               * Figma draws inactive rows with `opacity-50` on the text
               * block (#404040 @ 50% → effective #94979a, ~2.5:1 against
               * the sidebar bg). That fails WCAG AA color-contrast.
               * `text-quaternary` (#737373) is the closest match by tone
               * but still falls short at 4.06:1 for normal 14px text.
               * Glaon instead downshifts the title only: active title
               * stays `text-secondary` (#404040, ~8.8:1); inactive title
               * uses `text-tertiary` (#525252, ~6.3:1) which keeps the
               * visual hierarchy via the colour-step + still-bold
               * weight while passing axe-core. Descriptions in both
               * states use `text-tertiary` since the contrast budget
               * makes a deeper distinction impractical without a brand
               * accent. Revisit with design at the SetupStepNav
               * extraction (#538) once D2–D5 land. */}
              <div
                className="flex flex-1 flex-col pb-8"
                aria-current={isActive ? 'step' : undefined}
              >
                <p
                  className={`text-sm font-semibold leading-5 ${isActive ? 'text-secondary' : 'text-tertiary'}`}
                >
                  {step.title}
                </p>
                {step.description !== undefined && step.description !== '' && (
                  <p className="text-sm font-normal leading-5 text-tertiary">{step.description}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

interface DefaultSetupFooterProps {
  readonly year: number;
}

function DefaultSetupFooter({ year }: DefaultSetupFooterProps) {
  return (
    <>
      <p>© Glaon {year.toString()}</p>
      <a
        href="mailto:help@glaon.com"
        className="inline-flex items-center gap-2 text-tertiary hover:text-secondary"
      >
        {/* Inline minimal mail icon — keeps the footer dependency-free; the
         * Figma uses UUI mail-01 outline at size 16. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="1.667" y="2.667" width="12.667" height="10.667" rx="1.5" />
          <path d="M2 3.333 8 8l6-4.667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>help@glaon.com</span>
      </a>
    </>
  );
}
