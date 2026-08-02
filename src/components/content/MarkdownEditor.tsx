import { useRef, useState } from 'react';
import type { ClipboardEvent } from 'react';
import { Button } from '../primitives/Button';
import { FormField } from '../primitives/FormField';
import { describedBy } from '../primitives/describedBy';
import { InlineAlert } from '../feedback/InlineAlert';
import { Prose } from './Prose';
import * as s from './MarkdownEditor.css';
import * as controls from '../primitives/controls.css';

/**
 * The same pattern the server uses (`public.reject_raw_html`, migration 0030).
 *
 * Non-capturing group — the capturing version was a real bug there: `substring()` returns the
 * first parenthesised subexpression when one exists, so `<script>` matched but reported NULL.
 * Keeping the two in step matters, because a client that accepts what the server rejects
 * produces a save that fails with no obvious cause.
 */
const RAW_HTML = /<\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s[^>]*)?\/?>/;

type ToolbarAction = {
  label: string;
  /** Wraps the selection, or inserts at the caret when there is no selection. */
  apply: (selected: string) => { text: string; caretOffset: number };
};

const ACTIONS: ToolbarAction[] = [
  { label: 'H2', apply: (t) => ({ text: `## ${t}`, caretOffset: 3 }) },
  { label: 'H3', apply: (t) => ({ text: `### ${t}`, caretOffset: 4 }) },
  { label: 'Bold', apply: (t) => ({ text: `**${t}**`, caretOffset: 2 }) },
  { label: 'Italic', apply: (t) => ({ text: `*${t}*`, caretOffset: 1 }) },
  { label: 'List', apply: (t) => ({ text: `- ${t}`, caretOffset: 2 }) },
  { label: 'Numbered', apply: (t) => ({ text: `1. ${t}`, caretOffset: 3 }) },
  { label: 'Link', apply: (t) => ({ text: `[${t}](https://)`, caretOffset: 1 }) },
  { label: 'Quote', apply: (t) => ({ text: `> ${t}`, caretOffset: 2 }) },
];

export type MarkdownEditorProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  rows?: number;
  required?: boolean;
};

/**
 * The write side of `Prose` — design-system.md §5.3, FR-045.
 *
 * A toolbar so the owner never types Markdown syntax. A resort owner should not have to learn
 * what an asterisk does to publish a paragraph about the ferry.
 *
 * ⚠ THE PASTED-HTML CHECK HERE IS THE FIRST LINE, NOT THE GATE (FR-045a). The gate is
 * `reject_raw_html` in the database, which holds against a direct API call that never loads
 * this component. What this adds is *timing*: the owner finds out the moment they paste from
 * a website, while they still have the source to hand, instead of losing the paste to a save
 * error later.
 *
 * SHARED, NOT PER-ROUTE. Used by both the content editor and the settings screen (transport
 * notes are Markdown too, FR-053b). Reimplementing the toolbar per route is how the two drift
 * until one of them accepts something the other rejects.
 */
export function MarkdownEditor({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  rows = 14,
  required,
}: MarkdownEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);
  const [htmlWarning, setHtmlWarning] = useState<string | null>(null);

  function applyAction(action: ToolbarAction) {
    const el = ref.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const { text, caretOffset } = action.apply(selected);

    const next = value.slice(0, start) + text + value.slice(end);
    onChange(next);

    // Restore the caret after React commits, or the owner loses their place on every click.
    requestAnimationFrame(() => {
      el.focus();
      const caret = selected.length > 0 ? start + text.length : start + caretOffset;
      el.setSelectionRange(caret, caret);
    });
  }

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const pasted = event.clipboardData.getData('text/plain');
    const match = RAW_HTML.exec(pasted);
    if (!match) {
      setHtmlWarning(null);
      return;
    }

    // Refuse the paste rather than silently stripping it: stripping would quietly discard
    // content the owner believes they pasted, which is worse than telling them.
    event.preventDefault();
    setHtmlWarning(match[0]);
  }

  return (
    <div className={s.wrapper}>
      <FormField id={id} label={label} hint={hint} error={error} required={required}>
        <div className={s.toolbar} role="toolbar" aria-label={`${label} formatting`}>
          {ACTIONS.map((action) => (
            <Button
              key={action.label}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => applyAction(action)}
            >
              {action.label}
            </Button>
          ))}
          <span className={s.toolbarSpacer} />
          <Button
            type="button"
            variant={preview ? 'secondary' : 'ghost'}
            size="sm"
            aria-pressed={preview}
            onClick={() => setPreview((p) => !p)}
          >
            Preview
          </Button>
        </div>

        {preview ? (
          <div className={s.preview}>
            {value.trim() ? (
              <Prose markdown={value} />
            ) : (
              <span className={s.previewEmpty}>Nothing to preview yet.</span>
            )}
          </div>
        ) : (
          <textarea
            ref={ref}
            id={id}
            className={[controls.control, controls.textarea, error ? controls.controlInvalid : '']
              .filter(Boolean)
              .join(' ')}
            value={value}
            rows={rows}
            required={required}
            onChange={(e) => onChange(e.target.value)}
            onPaste={handlePaste}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(id, { hint, error })}
          />
        )}
      </FormField>

      {htmlWarning && (
        <InlineAlert tone="warning" title="That paste contained HTML">
          This field is Markdown, so <code>{htmlWarning}</code> was not pasted. Paste it as plain
          text and use the buttons above to format it.
        </InlineAlert>
      )}
    </div>
  );
}
