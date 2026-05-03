// Glaon Textarea — wraps the Untitled UI kit `TextArea` source under
// `packages/ui/src/components/base/textarea/textarea.tsx` for the
// default variant, and adds a hand-rolled `tags-inner` variant for the
// chip-based multi-value input pattern from the Figma `Inputs` page
// (https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=85-1269).
//
// Per CLAUDE.md's UUI Source Rule, the kit handles the structural
// HTML/CSS, focus / invalid / disabled state matrix, and resize-handle
// styling for the default variant; Glaon's contribution is the wrap
// layer (token override via `theme.css` + `glaon-overrides.css`, prop
// API consistency, Figma `parameters.design` mapping in stories).
//
// `tags-inner` falls under the "no kit source" exception — the kit
// ships no multi-value chip input pattern. We hand-roll a layout that
// mirrors the kit textarea surface (`bg-primary` rounded ring with the
// same focus / invalid affordances) and renders Glaon `<Badge>` chips
// at the top, with the typing area underneath. Keyboard contract:
//
//   - `Enter` / `,` / ` ` (configurable via `addTagOn`) confirms the
//     current text into a new chip and clears the input.
//   - `Backspace` on an empty input removes the last chip.
//   - `paste` splits on the first separator in `addTagOn` ↦ bulk add.

import type {
  ChangeEventHandler,
  ClipboardEventHandler,
  FocusEventHandler,
  KeyboardEventHandler,
  ReactNode,
  Ref,
} from 'react';
import { useCallback, useId, useRef, useState } from 'react';
import { TextField as AriaTextField } from 'react-aria-components';

import { HintText } from '../base/input/hint-text';
import { Label } from '../base/input/label';
import { Badge } from '../Badge';
import { TextArea as KitTextArea } from '../base/textarea/textarea';

export { TextAreaBase } from '../base/textarea/textarea';

export type TextareaSize = 'sm' | 'md';
export type TextareaVariant = 'default' | 'tags-inner';

/**
 * Keyboard tokens that confirm the current text into a chip. The
 * default set covers the most common patterns — Enter (deliberate
 * confirm) and comma (paste-friendly). Add `' '` for whitespace-as-
 * separator behaviour (typical for tag clouds), drop comma to allow
 * commas inside a single tag value (rare).
 */
export type TextareaTagSeparator = 'Enter' | ',' | ' ';

export interface TextareaProps {
  /**
   * Layout variant. `default` (the only Phase 1 mode until now) renders
   * the kit textarea verbatim. `tags-inner` splits the surface into a
   * chip list + typing area for multi-value capture (e.g. mail
   * recipients, tag clouds).
   * @default 'default'
   */
  variant?: TextareaVariant;
  /** Visible label rendered above the field. */
  label?: string;
  /** Helper text rendered below the field — re-styles red when `isInvalid`. */
  hint?: ReactNode;
  /** Inline tooltip trigger appended to the label (info icon). */
  tooltip?: string;
  /** Visual scale. */
  size?: TextareaSize;
  /** Native `<textarea rows>` (default variant) / starting line count (tags-inner). */
  rows?: number;
  /** Native `<textarea cols>`. */
  cols?: number;
  /** Placeholder shown in the typing area when empty. */
  placeholder?: string;
  /** Surface validation error styling (red border + ring). */
  isInvalid?: boolean;
  /** Block all interaction. */
  isDisabled?: boolean;
  /** Selectable / copyable but the value can't be edited. */
  isReadOnly?: boolean;
  /** Mark the field as required (forwards `aria-required`). */
  isRequired?: boolean;
  /** Hide the visual `*` next to the label without dropping `aria-required`. */
  hideRequiredIndicator?: boolean;
  /** Controlled value (default variant). */
  value?: string;
  /** Initial value (default variant). */
  defaultValue?: string;
  /** Form field name forwarded to the native textarea. */
  name?: string;
  /** Fires on every keystroke with the new string value (default variant). */
  onChange?: (value: string) => void;
  /** Fires when focus leaves the field. */
  onBlur?: FocusEventHandler;
  /** Fires when focus enters the field. */
  onFocus?: FocusEventHandler;
  /** Tailwind override hook for the outer wrapper. */
  className?: string;
  /** Tailwind override hook for the native `<textarea>`. */
  textAreaClassName?: string;
  /** Forwarded ref to the kit `<TextField>` wrapper (default variant). */
  ref?: Ref<HTMLDivElement>;
  /** Forwarded ref to the underlying `<textarea>` element. */
  textAreaRef?: Ref<HTMLTextAreaElement>;

  // --- tags-inner only ---

  /** Controlled chip list (tags-inner). Pair with `onTagsChange`. */
  tags?: readonly string[];
  /** Initial chip list (tags-inner, uncontrolled). */
  defaultTags?: readonly string[];
  /** Fires with the next chip list when chips are added or removed. */
  onTagsChange?: (tags: string[]) => void;
  /**
   * Keys that confirm the current text into a chip. Defaults to
   * `['Enter', ',']`.
   * @default ['Enter', ',']
   */
  addTagOn?: readonly TextareaTagSeparator[];
}

const DEFAULT_TAG_SEPARATORS: readonly TextareaTagSeparator[] = ['Enter', ','];

function joinClasses(...parts: (string | undefined | false | null)[]): string {
  return parts.filter((p): p is string => Boolean(p)).join(' ');
}

// Surface mirrors the kit's `TextAreaBase` so the tags-inner container
// reads as a Textarea family member. Focus + invalid styles via
// `:focus-within` so the parent `<div>` carries the visual state.
const tagsInnerSurface =
  'flex w-full flex-col gap-2 rounded-lg bg-primary text-primary shadow-xs ring-1 ring-primary ring-inset transition focus-within:ring-2 focus-within:ring-brand placeholder:text-placeholder';
const tagsInnerSizes: Record<TextareaSize, string> = {
  sm: 'p-3 text-sm',
  md: 'px-3.5 py-3 text-md',
};
const tagsInnerInvalid = 'ring-error_subtle focus-within:ring-2 focus-within:ring-error';
const tagsInnerDisabled = 'cursor-not-allowed opacity-50';

export function Textarea({
  variant = 'default',
  // tags-inner-only props (unused on default — destructure them out
  // so the rest spread doesn't carry them onto the kit textarea).
  tags,
  defaultTags,
  onTagsChange,
  addTagOn = DEFAULT_TAG_SEPARATORS,
  ...common
}: TextareaProps) {
  if (variant === 'default') {
    return <KitDefaultTextarea {...common} />;
  }

  const tagsProps: Pick<TagsInnerProps, 'tags' | 'defaultTags' | 'onTagsChange' | 'addTagOn'> = {
    addTagOn,
  };
  if (tags !== undefined) tagsProps.tags = tags;
  if (defaultTags !== undefined) tagsProps.defaultTags = defaultTags;
  if (onTagsChange !== undefined) tagsProps.onTagsChange = onTagsChange;

  return <TagsInnerTextarea {...common} {...tagsProps} />;
}

type CommonProps = Omit<
  TextareaProps,
  'variant' | 'tags' | 'defaultTags' | 'onTagsChange' | 'addTagOn'
>;

// `KitTextArea` declares its props with strict (non-undefined-tolerant)
// optional shapes; since our wrap allows callers to pass `undefined`
// to opt out, we spread conditionally so we never hand the kit an
// explicit `undefined` for an optional prop.
function KitDefaultTextarea(props: CommonProps) {
  // The kit accepts a wider `ClassNameOrFunction` type than our
  // string-only wrap; re-typing here would force every consumer to
  // know that. Spread conditionally so we never hand the kit an
  // explicit `undefined` for an optional prop (the kit's
  // `exactOptionalPropertyTypes` typing rejects that).
  const passthrough: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) passthrough[key] = value;
  }
  return <KitTextArea {...passthrough} />;
}

interface TagsInnerProps extends CommonProps {
  tags?: readonly string[];
  defaultTags?: readonly string[];
  onTagsChange?: (tags: string[]) => void;
  addTagOn?: readonly TextareaTagSeparator[];
}

function TagsInnerTextarea(props: TagsInnerProps) {
  const {
    label,
    hint,
    tooltip,
    size = 'md',
    rows,
    cols,
    placeholder,
    isInvalid = false,
    isDisabled = false,
    isReadOnly = false,
    isRequired = false,
    hideRequiredIndicator = false,
    name,
    className,
    textAreaClassName,
    onBlur,
    onFocus,
    ref,
    textAreaRef,
    tags: controlledTags,
    defaultTags,
    onTagsChange,
    addTagOn = DEFAULT_TAG_SEPARATORS,
  } = props;

  const [uncontrolledTags, setUncontrolledTags] = useState<string[]>(() =>
    defaultTags !== undefined ? [...defaultTags] : [],
  );
  const isControlled = controlledTags !== undefined;
  const currentTags: readonly string[] = isControlled ? controlledTags : uncontrolledTags;
  const innerTextAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const hintId = useId();

  const setTextAreaRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      innerTextAreaRef.current = node;
      if (typeof textAreaRef === 'function') {
        textAreaRef(node);
      } else if (textAreaRef !== undefined && textAreaRef !== null) {
        (textAreaRef as { current: HTMLTextAreaElement | null }).current = node;
      }
    },
    [textAreaRef],
  );

  const updateTags = useCallback(
    (next: string[]) => {
      if (!isControlled) {
        setUncontrolledTags(next);
      }
      onTagsChange?.(next);
    },
    [isControlled, onTagsChange],
  );

  const commitDraft = useCallback(
    (raw: string) => {
      const cleaned = raw.trim();
      if (cleaned.length === 0) return;
      if (currentTags.includes(cleaned)) {
        setDraftValue('');
        return;
      }
      updateTags([...currentTags, cleaned]);
      setDraftValue('');
    },
    [currentTags, updateTags],
  );

  const removeTag = useCallback(
    (tagToRemove: string) => {
      updateTags(currentTags.filter((t) => t !== tagToRemove));
    },
    [currentTags, updateTags],
  );

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      if (isReadOnly || isDisabled) return;

      const keyToken: TextareaTagSeparator | undefined =
        event.key === 'Enter'
          ? 'Enter'
          : event.key === ','
            ? ','
            : event.key === ' '
              ? ' '
              : undefined;
      if (keyToken !== undefined && addTagOn.includes(keyToken)) {
        event.preventDefault();
        commitDraft(draftValue);
        return;
      }

      // Backspace on an empty draft pops the last chip — typical
      // chip-input UX; lets keyboard users prune mistakes without
      // reaching for the X button.
      if (event.key === 'Backspace' && draftValue.length === 0 && currentTags.length > 0) {
        event.preventDefault();
        const next = [...currentTags];
        next.pop();
        updateTags(next);
      }
    },
    [addTagOn, commitDraft, currentTags, draftValue, isDisabled, isReadOnly, updateTags],
  );

  const handlePaste: ClipboardEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      if (isReadOnly || isDisabled) return;
      const pasted = event.clipboardData.getData('text');
      const bulkDelimiter = addTagOn.find((s) => s !== 'Enter');
      if (bulkDelimiter === undefined || !pasted.includes(bulkDelimiter)) {
        return;
      }
      event.preventDefault();
      const additions = pasted
        .split(bulkDelimiter)
        .map((part) => part.trim())
        .filter((part) => part.length > 0 && !currentTags.includes(part));
      if (additions.length === 0) return;
      const dedupedAdditions = additions.filter(
        (entry, index, all) => all.indexOf(entry) === index,
      );
      updateTags([...currentTags, ...dedupedAdditions]);
      setDraftValue('');
    },
    [addTagOn, currentTags, isDisabled, isReadOnly, updateTags],
  );

  const handleDraftChange: ChangeEventHandler<HTMLTextAreaElement> = useCallback((event) => {
    setDraftValue(event.currentTarget.value);
  }, []);

  const surfaceClass = joinClasses(
    tagsInnerSurface,
    tagsInnerSizes[size],
    isInvalid && tagsInnerInvalid,
    isDisabled && tagsInnerDisabled,
  );

  // Build the AriaTextField props object conditionally to avoid handing
  // RAC explicit `undefined` for an optional prop (exactOptionalPropertyTypes).
  // RAC's TextField generics for the render-prop `className` resist a
  // narrow object literal type here, so we type the bag as `unknown`
  // and cast on the spread.
  const fieldProps: Record<string, unknown> = {
    isInvalid,
    isDisabled,
    isReadOnly,
    isRequired,
    className: joinClasses(
      'group flex h-max w-full flex-col items-start justify-start gap-1.5',
      className,
    ),
  };
  if (name !== undefined) fieldProps.name = name;
  if (ref !== undefined) fieldProps.ref = ref;
  if (onBlur !== undefined) fieldProps.onBlur = onBlur;
  if (onFocus !== undefined) fieldProps.onFocus = onFocus;

  return (
    <AriaTextField {...fieldProps}>
      {label !== undefined && (
        <Label
          isRequired={hideRequiredIndicator ? !hideRequiredIndicator : isRequired}
          {...(tooltip !== undefined ? { tooltip } : {})}
        >
          {label}
        </Label>
      )}

      <div
        className={surfaceClass}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            innerTextAreaRef.current?.focus();
          }
        }}
      >
        {currentTags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" role="list">
            {currentTags.map((tag) => (
              <li key={tag}>
                <Badge
                  size={size}
                  color="gray"
                  icon="close"
                  onClose={() => {
                    removeTag(tag);
                  }}
                >
                  {tag}
                </Badge>
              </li>
            ))}
          </ul>
        )}

        <textarea
          ref={setTextAreaRef}
          rows={rows ?? 1}
          {...(cols !== undefined ? { cols } : {})}
          {...(currentTags.length === 0 && placeholder !== undefined ? { placeholder } : {})}
          value={draftValue}
          onChange={handleDraftChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={isDisabled}
          readOnly={isReadOnly}
          aria-invalid={isInvalid}
          aria-required={isRequired}
          {...(hint !== undefined ? { 'aria-describedby': hintId } : {})}
          className={joinClasses(
            'w-full resize-none border-0 bg-transparent text-current outline-hidden focus:outline-hidden placeholder:text-placeholder',
            textAreaClassName,
          )}
        />
      </div>

      {hint !== undefined && (
        <HintText id={hintId} isInvalid={isInvalid} size={size}>
          {hint}
        </HintText>
      )}
    </AriaTextField>
  );
}
