module.exports = {
  extends: ['airbnb-typescript-prettier'],
  parserOptions: {
    project: './tsconfig.json',
  },
  settings: {
    'import/resolver': {
      'eslint-import-resolver-custom-alias': {
        alias: {
          src: './src',
          types: './types',
        },
        extensions: ['.js', '.ts'],
      },
    },
  },
  rules: {
    'simple-import-sort/imports': 'warn',
    quotes: [2, 'single', { avoidEscape: true }],
    'prettier/prettier': 'error',

    // TODO: ticket all of these to be enabled or explain why they are disabled
    // Destructuring props is not required because it clutters the function type signature.
    // Props can be destructured in a separate line.
    'react/destructuring-assignment': 'off',
    // Use TypeScript instead of PropTypes for new code.
    'react/forbid-prop-types': 'off',
    'react/prop-types': 'off',
    'react/require-default-props': 'off',
    'react/sort-comp': 'off',
    'react/static-property-placement': 'off',

    'import/named': 'off',
    'import/no-cycle': 'off',
    'import/no-named-as-default': 'off',
    // Named exports are more convenient for mocking.
    'import/prefer-default-export': 'off',

    // TS directive comments will be necessary during transition from JS to TS.
    '@typescript-eslint/ban-ts-comment': 'off',
    // TODO: Replace these types with alternatives recommended by this rule.
    '@typescript-eslint/ban-types': ['error', { types: { Function: false, Object: false, '{}': false } }],
    // No-ops are often used in tests and sometimes as default values for callback props.
    '@typescript-eslint/no-empty-function': 'off',
    // `any` is useful for incremental type improvements during the transition from JS to TS.
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-shadow': 'off',
    '@typescript-eslint/no-use-before-define': 'off',

    'class-methods-use-this': 'off',
    'consistent-return': 'off',
    'default-param-last': 'off',
    'func-names': 'off',
    // Formatting is handled by Prettier.
    'max-len': 'off',
    'no-await-in-loop': 'off',
    'no-case-declarations': 'off',
    // Allow some console methods.
    'no-console': ['warn', { allow: ['assert', 'error'] }],
    // Allow `while (true) {...}`
    'no-constant-condition': ['error', {checkLoops: false}],
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-continue': 'off',
    'no-nested-ternary': 'off',
    'no-param-reassign': 'off',
    'no-plusplus': 'off',
    'no-promise-executor-return': 'off',
    'no-restricted-syntax': 'off',
    'no-return-await': 'off',
    'no-unused-expressions': 'off',
    'no-void': 'off',
    'prefer-destructuring': 'off',
    'prefer-promise-reject-errors': 'off',
    'prefer-regex-literals': 'off',
    radix: 'off',
    //

    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        args: 'all',
        argsIgnorePattern: '_|^_|^props',
        ignoreRestSiblings: true,
      },
    ],
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.js', 'src/setupTests.js'],
      env: {
        jest: true,
      },
    },
    {
      files: 'src/**/*.{js,ts}',
      rules: {
        // 'no-console': ['warn', { allow: ['assert', 'error'] }],//TODO: should be enabled
      },
    },
    {
      files: ['integration-tests/**'],
      rules: {
        // Integration tests use CommonJS instead of ESM.
        '@typescript-eslint/no-var-requires': 'off',
        // TODO: Add dependencies to package.json.
        'import/no-extraneous-dependencies': 'off',
        // Integration tests frequently log.
        'no-console': 'off',
      }
    },
  ],
  plugins: ['lodash-fp', 'simple-import-sort'],
};
