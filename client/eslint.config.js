import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

/** Import order: React → context → hooks → lib → components → other @/ → relative */
const importOrder = [
  'error',
  {
    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
    pathGroups: [
      { pattern: 'react', group: 'external', position: 'before' },
      { pattern: '@/context/**', group: 'internal', position: 'before' },
      { pattern: '@/hooks/**', group: 'internal', position: 'before' },
      { pattern: '@/lib/**', group: 'internal', position: 'before' },
      { pattern: '@/components/**', group: 'internal', position: 'before' },
    ],
    pathGroupsExcludedImportTypes: [],
    'newlines-between': 'never',
    alphabetize: { order: 'asc', caseInsensitive: true },
  },
];

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'import/order': importOrder,
    },
  },
]);
