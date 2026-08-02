import Markdown from 'react-markdown';
import * as s from './Prose.css';

export type ProseProps = {
  /**
   * Markdown. **There is no `html` prop and there must never be one.**
   *
   * design-system.md §5.3: "`Prose` must never grow an `html` escape hatch. The entire safety
   * argument for it is that raw HTML was refused at save time, so there is no sanitiser here
   * and no sanitiser to keep patched."
   */
  markdown: string;
  className?: string;
};

/**
 * Renders owner-authored Markdown — spec C7, FR-045a.
 *
 * ══════════════════════════════════════════════════════════════════════════════════
 * THREE INDEPENDENT LAYERS STOP RAW HTML, AND THIS IS THE THIRD.
 * ══════════════════════════════════════════════════════════════════════════════════
 *
 *   1. `public.reject_raw_html()` refuses it at save (migrations 0028/0030). This is THE
 *      gate — the one that holds against a direct API call bypassing the interface entirely.
 *   2. `MarkdownEditor` rejects pasted HTML in the browser, so the owner finds out while
 *      they are still editing rather than on submit.
 *   3. This component never enables `rehype-raw`.
 *
 * react-markdown ignores raw HTML by default; `rehype-raw` is what would parse it, and it is
 * deliberately not installed. Adding it — or a `dangerouslySetInnerHTML` "just for one page"
 * — reinstates stored XSS. Per §2.3 of the security baseline that means the owner's session,
 * and the owner's session is the only account there is.
 *
 * `eslint.config.js` bans `dangerouslySetInnerHTML` repo-wide so the rule outlives whoever
 * remembers the reason.
 *
 * Links are hardened here rather than trusted: an owner can legitimately write
 * `[book here](https://...)`, and the same field could carry `javascript:` if the check lived
 * only at save time.
 */
const SAFE_PROTOCOL = /^(https?:|mailto:|tel:|\/|#)/i;

export function Prose({ markdown, className }: ProseProps) {
  return (
    <div className={[s.prose, className ?? ''].filter(Boolean).join(' ')}>
      <Markdown
        // No `rehypePlugins`. See the note above — this is load-bearing, not an omission.
        urlTransform={(url) => (SAFE_PROTOCOL.test(url) ? url : '')}
        components={{
          a: ({ href, children, ...rest }) => {
            const external = href ? /^https?:/i.test(href) : false;
            return (
              <a
                href={href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                {...rest}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {markdown}
      </Markdown>
    </div>
  );
}
