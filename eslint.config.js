import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'coverage', 'playwright-report', 'test-results'],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // ── Constitution guards ────────────────────────────────────────────────
      // C7 / security-baseline §4.4a: no HTML render path anywhere. The safety argument
      // for Prose is that the unsafe API is absent, not used carefully.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="dangerouslySetInnerHTML"]',
          message:
            'Forbidden (C7). Content is Markdown rendered with react-markdown; raw HTML is rejected at save.',
        },
      ],
      // design-system §3.3 — keep the rule, but the reason it originally gave was wrong.
      //
      // The claim was "assignInlineVars emits a style attribute that style-src 'self' blocks
      // silently". Verified against react-dom 19.2.8: React applies the `style` prop with
      // `node.style.setProperty(...)` and never calls `setAttribute("style", …)`. That is the
      // CSSOM, which CSP does not govern — the same path setElementVars uses. Under the
      // client-only render this app does (`createRoot`, no SSR), assignInlineVars is NOT
      // blocked, and neither is any other inline style.
      //
      // The rule stands on two narrower grounds:
      //   1. It breaks the moment SSR is introduced. Server-rendered markup DOES carry a real
      //      style="" attribute, which style-src 'self' blocks — and the failure is silent and
      //      server-only, the worst combination to debug.
      //   2. Branding is applied to :root once, imperatively. setElementVars fits that;
      //      assignInlineVars would mean threading a style object through the tree to an
      //      element that is not React's to own.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@vanilla-extract/dynamic',
              importNames: ['assignInlineVars'],
              message:
                'Use setElementVars. Branding is applied imperatively to :root, and assignInlineVars breaks under SSR, where a real style attribute is emitted and style-src blocks it.',
            },
          ],
        },
      ],
    },
  },
);
