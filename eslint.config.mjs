// Lint for plain-JS runtime files. TypeScript sources (.ts) and .astro files
// are covered by `npm run typecheck` (astro check + tsc).
export default [
  {
    files: ['scripts/**/*.mjs', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-eval': 'error',
      eqeqeq: ['error', 'smart'],
    },
  },
  { ignores: ['dist/**', 'node_modules/**', '.astro/**'] },
];
