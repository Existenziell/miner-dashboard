import stylelintConfigStandard from 'stylelint-config-standard';

/** @type {import('stylelint').Config} */
export default {
  extends: [stylelintConfigStandard],
  overrides: [
    {
      files: ['**/*.css'],
      rules: {
        /* Tailwind v4 at-rules */
        'at-rule-no-unknown': [
          true,
          {
            ignoreAtRules: [
              'apply',
              'custom-variant',
              'layer',
              'theme',
              'tailwind',
            ],
          },
        ],
        /* Tailwind @apply uses utility names that aren't kebab-case (e.g. dark:border-edge-dark) */
        'selector-class-pattern': null,
        /* Tailwind v4 uses @import "tailwindcss" (string, not url()) */
        'import-notation': null,
        /* Vendor prefixes needed for number input spinner (Chrome, Safari, Firefox) */
        'property-no-vendor-prefix': [
          true,
          { ignoreProperties: ['-webkit-appearance', '-moz-appearance', 'appearance'] },
        ],
      },
    },
  ],
};
