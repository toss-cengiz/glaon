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
      '**/src/hooks/**',
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
  // Token storage boundary — see ADR 0006 (Phase 2 revision via ADR 0017) and issue #9.
  // localStorage / sessionStorage are forbidden on web; AsyncStorage is forbidden on mobile.
  // Refresh tokens must live in httpOnly cookies (web) or hardware-backed SecureStore (mobile).
  {
    files: ['**/auth/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'localStorage',
          message: 'Token paths must not use localStorage — see ADR 0006 (issue #9).',
        },
        {
          name: 'sessionStorage',
          message: 'Token paths must not use sessionStorage — see ADR 0006 (issue #9).',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@react-native-async-storage/async-storage',
              message:
                'Token paths must not use AsyncStorage — use expo-secure-store via @glaon/core/auth KeyValueTokenStore (ADR 0006).',
            },
          ],
        },
      ],
    },
  },
);
