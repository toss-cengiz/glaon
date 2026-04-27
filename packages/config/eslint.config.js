// Shared flat ESLint config for all Glaon workspaces.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/.expo/**',
      '**/.turbo/**',
      '**/node_modules/**',
      '**/*.config.{js,mjs,cjs,ts}',
      '**/metro.config.js',
      '**/babel.config.js',
      '**/vite.config.ts',
      '**/.storybook/**',
      '**/storybook-static/**',
      // Untitled UI kit source pulled via `npx untitledui add`. The kit
      // ships pre-formatted but does not pass our strict rules; rather
      // than fork files, we let `untitledui upgrade` overwrite them
      // freely. Glaon's wrap layer (sibling files outside these globs)
      // stays under the strict ruleset.
      '**/src/components/base/**',
      '**/src/components/application/**',
      '**/src/components/foundations/**',
      '**/src/components/shared-assets/**',
      '**/src/components/marketing/**',
      '**/src/utils/cx.ts',
      '**/src/utils/is-react-component.ts',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    settings: { react: { version: '19.0' } },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
);
