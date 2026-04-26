---
name: brand-design
description: Answer brand-level design questions for Glaon — color/typography/spacing tokens, component personality, and do/don't guidance. Invoke when the user asks about Glaon's visual identity, proposes a new token, drafts a primitive variant, or needs a Figma Plugin script to mutate the design file. Skill is read-only: Figma stays the canonical source, and any design mutation is authored as a Figma Plugin script for the user to run manually in Figma.
---

# Brand Design — Glaon

This skill encodes Glaon's brand decisions and the contract for Claude-authored design changes. Read [docs/figma.md](../../../docs/figma.md) first — it fixes the design source-of-truth rules this skill operates under.

## Invocation contract

- **Read-only by default.** Claude does not write to Figma. Brand/token decisions live in Figma; this skill references them and proposes changes as Figma Plugin scripts the user runs manually.
- **Figma Plugin over REST.** Any design mutation is delivered as a plugin script under [`tools/figma-plugin/`](../../../tools/figma-plugin/). REST write scope is explicitly out of Phase 0 (see `docs/figma.md` follow-ups).
- **One review step.** Claude outputs the script → user loads it in Figma's plugin runner → reviews the preview → accepts or discards. No autonomous design mutation ever.
- **Defer token values to Figma.** This skill holds _policy and rationale_, not hex codes. When Figma Variables are populated, the token generator issue (see `docs/figma.md`) produces the JSON and transforms; this skill points at them, never duplicates.

## When to use this skill

Typical prompts that should route here:

- "Propose a warning-state color for Glaon."
- "Which token should this card background use?"
- "Draft a modal pattern that fits Glaon's personality."
- "Write a Figma Plugin script that renames all `color/gray/*` variables to `color/neutral/*`."
- "Is this component density on-brand?"

Out of scope (route elsewhere):

- Accessibility lint or contrast auditing → Storybook `addon-a11y` is authoritative; open a separate issue for a skill if needed.
- Copy tone / microcopy → separate concern, not in this skill.
- Token JSON export from Figma → token generator issue (deferred in `docs/figma.md`).

## Brand inputs

Glaon's Brand Guideline Figma file is the canonical source for brand decisions — color rationale, typography scale, spacing/radii/shadow, logo usage, component personality. The Design System Figma file consumes those decisions later as published token primitives. Both files are tabled in [docs/figma.md](../../../docs/figma.md#dosya-yapısı).

### Color palette

Glaon's color system is split into two Figma Variable collections (see [`docs/design-system-bootstrap.md`](../../../docs/design-system-bootstrap.md#variables--koleksiyonlar-ve-modes)):

- **Primitives** — the raw palette inherited from the Brand Guideline (neutrals, brand hue, accents). Components never reference these directly.
- **Semantics** — the contract components consume. Each semantic binds to a primitive via `Theme: light` / `Theme: dark` modes.

Two non-negotiable rules:

- Components reference semantics, never primitives. A swap of the brand hue must cascade through one rebinding, not a codebase sweep.
- Light and dark are designed together, not retrofitted. Until #140 lands, dark bindings fall back to the Light primitive but the binding slot exists from day one — semantic _names_ are stable forever; only the values move.

Semantic roles, with what each one means and when to reach for it:

- **`surface/default`** — the canvas a screen sits on. Most layouts default to this. Calm, low chrome.
- **`surface/muted`** — a recessed surface inside `surface/default`: form rows, list groups, secondary panels. Signals "still part of the page, but a step back".
- **`surface/raised`** — an elevated surface above the canvas: cards, popovers, modals. Pairs with shadow tokens; never carry depth in color alone. Final binding lands with #139.
- **`text/primary`** — body and heading text on `surface/default` / `surface/muted`. Must clear WCAG AA 4.5:1 against both.
- **`text/muted`** — secondary text: captions, helper, timestamps. Same 4.5:1 floor — `muted` is a hue/weight choice, not a contrast escape hatch.
- **`text/inverse`** — text on dark or saturated surfaces (e.g. label on `brand/primary`). "Inverse" is relative to the surface beneath it, not a literal theme inversion.
- **`border/subtle`** — quiet dividers, inputs at rest, list separators. 3:1 against the adjacent surface (non-text UI floor).
- **`border/strong`** — focus rings, selected state, emphatic dividers. 3:1 minimum; design intent typically clears it comfortably.
- **`brand/primary`** — primary CTAs and the few places Glaon "speaks" with brand color. Use sparingly: density of brand color is inversely proportional to the trust it conveys.
- **`brand/hover` / `brand/pressed`** — interactive shifts on `brand/primary`. Don't invent ad-hoc darkening; the tokens encode the brand's preferred curve. Lands with #138.
- **`state/success`** — confirmation, healthy device. Greenish but inherits the brand's temperature; we don't ship a generic semaphore green.
- **`state/warning`** — caution, non-blocking attention. Amber/yellow family; always paired with a glyph because hue alone fails colorblind users.
- **`state/danger`** — destructive affirmation, fault state. The most restrained role on the list — overuse desensitizes, so it's reserved for actions or states that genuinely cannot be undone or ignored. Hue locked in #137.

Light/dark mapping lives in Figma Variables `Theme` mode. Both modes share the same semantic name and diverge only in which primitive they bind to — that's what lets a component written against `text/primary` swap automatically when the theme flips, with no per-component dark variant.

Accessibility floors (record per role; don't ask the developer to recompute):

- Text on its surface — WCAG AA 4.5:1 minimum; aim for AAA 7:1 on body text in long-session contexts (wall tablet) where eye fatigue compounds.
- Non-text UI (borders, focus rings, state glyphs) — 3:1 against the adjacent surface.
- Brand color is not exempt: `brand/primary` over `surface/default` must clear 3:1 as a UI element, and 4.5:1 if text rides on it.

Hex values, gradients, and exact alpha stops live in the Brand Guideline Figma file and the published Design System library. Don't restate them here — the skill points; Figma defines.

### Typography

_TBD — typography scale lands with Design System Figma text styles._ Once fixed, record:

- Font family decisions (web stack + RN stack, since they diverge).
- Scale ratio and size steps.
- Weight + line-height pairings per role (display, heading, body, caption).

### Spacing / radii / shadow

_TBD — lands with Figma Variables._ Keep in mind:

- Spacing scale is one source; RN multiplier lives in the Style Dictionary transform, not in this skill.
- Radii: aim for a small set (e.g. `sm`, `md`, `lg`, `pill`) — resist per-component custom radii.
- Shadow: distinct levels, each tied to an elevation role (card, dialog, popover).

### Component personality

Glaon is a secure Home Assistant frontend — tablet-first, long sessions, family-shared context. The visual language should match:

- **Calm, not flashy.** Muted surfaces, minimal chrome, typography does the heavy lifting.
- **Dense but breathable.** Wall-tablet use means information density matters; let spacing tokens do the breathing room, don't waste it on decoration.
- **Motion is restraint.** Transitions communicate state (loading, success), not delight. Avoid bounce/spring unless it reinforces a physical metaphor.
- **Trust cues are explicit.** Security-facing UI (auth, device state, permission) uses a clearly distinct visual register — not buried in general chrome.

### Do / don't

- **Do** reuse tokens — if a value isn't in the token set, propose a token, don't hard-code.
- **Do** prefer primitives over one-off styles. A new variant of an existing primitive beats a new component.
- **Do** match the wall-tablet use case: large touch targets, legible at arm's length, no hover-only affordances.
- **Don't** propose hex codes or raw px values in code. References only.
- **Don't** invent a new spacing step "just this once" — pick the closest existing one or raise a token issue.
- **Don't** duplicate brand decisions here and in Figma. Figma wins; this file references.
- **Don't** use motion for delight. Motion must carry signal.

## Figma Plugin bridge

When a design change is needed — renaming variables, bulk-applying a color, generating variants — Claude writes a Figma Plugin script that the user runs manually.

Scaffold: [`tools/figma-plugin/`](../../../tools/figma-plugin/) — manifest + entry. Replace `code.js` with the Claude-authored script for the current task, then load/reload the plugin in Figma and run it.

Script shape:

```js
// code.js — Claude-authored, replace per task
(async () => {
  try {
    // Read-side: inspect what's there.
    const variables = await figma.variables.getLocalVariablesAsync();

    // Mutation-side: propose, don't commit silently. Log a summary.
    // ... mutation logic ...

    figma.notify('Glaon: done. Review changes in Figma and publish the library.');
  } catch (err) {
    figma.notify(`Glaon plugin error: ${err.message}`, { error: true });
    throw err;
  } finally {
    figma.closePlugin();
  }
})();
```

Guardrails for Claude-authored scripts:

- **Dry-run by default.** If the script mutates, first log a summary of what it _would_ change, then require a `CONFIRM = true` constant the user flips to actually apply.
- **Scoped calls only.** Touch the specific nodes/variables the task asks for. No sweeping changes.
- **No network.** Plugin manifest does not grant network access. If a task needs external data, block and ask the user.
- **Always `figma.closePlugin()` at the end.** Even on error paths.
- **Notify on completion.** `figma.notify(...)` is the minimum UX — the user must see confirmation.

## Handoff back to code

A plugin mutation is not the end of the change. Once the user accepts and publishes in Figma:

1. If tokens changed → the token generator (deferred issue, see `docs/figma.md`) regenerates the JSON. Until that exists, the user manually exports and commits.
2. If a component changed → Chromatic design-code diff flags the drift on the next build (see `docs/chromatic.md`). A follow-up code PR wires the update.
3. If a new primitive was drawn → Storybook Rule kicks in: the primitive's story gets written in the same PR that wires it (see `docs/storybook.md`).

This skill does not close loops on its own — it proposes and hands off.
