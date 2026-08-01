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
      // design-system §3.3: assignInlineVars emits a style="" attribute that style-src 'self'
      // blocks silently. setElementVars writes through the CSSOM, which CSP does not govern.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@vanilla-extract/dynamic',
              importNames: ['assignInlineVars'],
              message:
                'Use setElementVars. assignInlineVars emits a style attribute that CSP blocks silently.',
            },
          ],
        },
      ],
    },
  },
);
