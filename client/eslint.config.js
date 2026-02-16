import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unusedImports from 'eslint-plugin-unused-imports';
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
      react,
      'unused-imports': unusedImports,
    },
    rules: {
      /* Mark React and JSX identifiers as used so unused-imports doesn't false-positive */
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'no-unused-vars': 'error',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],
      'import/order': importOrder,
      /* Stricter style & safety */
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'prefer-template': 'warn',
    },
  },
  /* Test files: same rules + Vitest globals */
  {
    files: ['**/*.test.js', '**/*.spec.js'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.vitest },
    },
  },
]);
