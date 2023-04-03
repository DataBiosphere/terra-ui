module.exports = {
  extends: ['prettier', 'airbnb', 'airbnb-typescript'],
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
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.js'],
      env: {
        jest: true,
      },
    },
    {
      files: 'src/**/*.{js,ts}',
      rules: {
        'no-console': ['warn', { allow: ['assert', 'error'] }],
      },
    },
  ],
  rules: {
    indent: 'off',
    'comma-dangle': 'off',
    'import/prefer-default-export': 'off',

    // TODO: ticket all of these to be enabled or explain why they are disabled
    'react/forbid-prop-types': 'off',
    'react/prop-types': 'off',
    'react/sort-comp': 'off',
    'react/destructuring-assignment': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'react/require-default-props': 'off',
    'react/static-property-placement': 'off',

    'import/no-cycle': 'off',
    'import/no-named-as-default': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/extensions': 'off',
    'import/no-relative-parent-imports': 'off',

    '@typescript-eslint/default-param-last': 'off',
    '@typescript-eslint/return-await': 'off',
    '@typescript-eslint/no-shadow': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/no-unused-expressions': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off', // TODO: should be 'warn',
    '@typescript-eslint/no-implied-eval': 'off',
    '@typescript-eslint/no-throw-literal': 'off',
    '@typescript-eslint/naming-convention': 'off',

    'no-case-declarations': 'off',
    'no-nested-ternary': 'off',
    'no-plusplus': 'off',
    'no-undef': 'off',
    'no-await-in-loop': 'off',
    'no-underscore-dangle': 'off',
    'no-param-reassign': 'off',
    'no-restricted-syntax': 'off',
    'no-void': 'off',
    'no-empty': 'off',
    'no-constant-condition': 'off',
    'no-promise-executor-return': 'off',
    'no-continue': 'off',
    'no-dupe-keys': 'off',

    'prefer-promise-reject-errors': 'off',
    'prefer-regex-literals': 'off',
    'prefer-destructuring': 'off',

    'symbol-description': 'off',
    'operator-linebreak': 'off',
    'max-len': 'off', // TODO: should be: ['warn', { code: 120 }],
    radix: 'off',
    'func-names': 'off',
    'implicit-arrow-linebreak': 'off',
    'consistent-return': 'off',
    'class-methods-use-this': 'off',
    //

    'no-unsafe-optional-chaining': 'warn',
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
  plugins: ['lodash-fp', 'import', 'simple-import-sort', 'prettier'],
};
