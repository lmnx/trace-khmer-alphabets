import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const storageMessage = 'Only src/lib/progress.ts touches localStorage (see CLAUDE.md).';

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'playwright-report', 'test-results']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      // Security rules from CLAUDE.md, enforced rather than remembered.
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'No dangerouslySetInnerHTML (see CLAUDE.md).',
        },
        {
          selector: 'AssignmentExpression[left.property.name=/^(inner|outer)HTML$/]',
          message: 'No innerHTML or outerHTML (see CLAUDE.md).',
        },
        {
          selector: "CallExpression[callee.property.name='insertAdjacentHTML']",
          message: 'No insertAdjacentHTML (see CLAUDE.md).',
        },
        {
          selector: "CallExpression[callee.object.name='document'][callee.property.name=/^write(ln)?$/]",
          message: 'No document.write.',
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'localStorage', message: storageMessage },
        { name: 'sessionStorage', message: storageMessage },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'window', property: 'localStorage', message: storageMessage },
        { object: 'window', property: 'sessionStorage', message: storageMessage },
        { object: 'globalThis', property: 'localStorage', message: storageMessage },
      ],
    },
  },
  {
    files: ['src/lib/progress.ts'],
    rules: {
      'no-restricted-globals': 'off',
      'no-restricted-properties': 'off',
    },
  },
  {
    files: ['*.config.ts', 'plugins/**/*.ts', 'scripts/**/*.ts', 'tests/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
]);
