// eslint.config.cjs
/* eslint-env node */
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const importPlugin = require('eslint-plugin-import');
const promisePlugin = require('eslint-plugin-promise');
const simpleImportSort = require('eslint-plugin-simple-import-sort');
const prettierPlugin = require('eslint-plugin-prettier');
const jestPlugin = require('eslint-plugin-jest');
const eslintConfigPrettier = require('eslint-config-prettier');

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  // 1) Ignore patterns (replaces .eslintignore)
  {
    ignores: ['dist', 'node_modules', 'coverage'],
  },

  // 2) TypeScript source
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: __dirname,
        sourceType: 'module',
        ecmaVersion: 2023,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      promise: promisePlugin,
      'simple-import-sort': simpleImportSort,
      prettier: prettierPlugin,
    },
    settings: {
      'import/resolver': {
        // enable TS path resolution for eslint-plugin-import
        typescript: {
          project: ['./tsconfig.json'],
        },
      },
    },
    rules: {
      // TypeScript best practices
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      // Imports
      'import/order': 'off',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // Promises
      'promise/always-return': 'off',
      'promise/catch-or-return': ['warn', { allowThen: true }],

      // Prettier integration
      'prettier/prettier': 'error',

      // General
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // 3) Tests
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    plugins: { jest: jestPlugin },
    languageOptions: {
      globals: {
        // basic Jest globals
        afterAll: true,
        afterEach: true,
        beforeAll: true,
        beforeEach: true,
        describe: true,
        expect: true,
        it: true,
        jest: true,
        test: true,
      },
    },
    rules: {
      ...jestPlugin.configs.recommended.rules,
      ...jestPlugin.configs.style.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },

  // 4) Disable rules that conflict with Prettier (must be last)
  eslintConfigPrettier,
];
