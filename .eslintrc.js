module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: [
    'lodash-fp',
    'simple-import-sort',
    'prettier',
    'react',
    'react-hooks',
    '@typescript-eslint',
    'import'
  ],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  settings: {
    react: {
      createClass: 'createReactClass', // Regex for Component Factory to use,
      // default to "createReactClass"
      pragma: 'React', // Pragma to use, default to "React"
      fragment: 'Fragment', // Fragment to use (may be a property of <pragma>), default to "Fragment"
      version: 'detect', // React version. "detect" automatically picks the version you have installed.
      // You can also use `16.0`, `16.3`, etc, if you want to override the detected value.
      // It will default to "latest" and warn if missing, and to "detect" in the future
      flowVersion: '0.53' // Flow version
    },
    'import/resolver': {
      'eslint-import-resolver-custom-alias': {
        alias: {
          src: './src',
          types: './types'
        },
        extensions: ['.js', '.ts']
      }
    }
  },
  env: {
    browser: true,
    node: true,
    jest: true
  },
  rules: {
    //old rules
    // Best Practices
    'no-multi-spaces': 'warn',
    'require-await': 'warn',
    // Stylistic Issues
    'array-bracket-newline': ['warn', 'consistent'],
    'array-bracket-spacing': 'warn',
    'block-spacing': 'warn',
    'brace-style': ['warn', '1tbs', { allowSingleLine: true }],
    camelcase: ['warn', { properties: 'never' }],
    'comma-dangle': ['warn', 'only-multiline'],
    'comma-spacing': 'warn',
    'comma-style': 'warn',
    'computed-property-spacing': 'warn',
    'eol-last': 'warn',
    'func-call-spacing': 'warn',
    'implicit-arrow-linebreak': 'warn',
    indent: ['warn', 2, { SwitchCase: 1, CallExpression: { arguments: 1 } }],
    'key-spacing': 'warn',
    'keyword-spacing': 'warn',
    'lines-between-class-members': 'warn',
    '@typescript-eslint/member-delimiter-style': ['warn', { multiline: { delimiter: 'none' } }],
    'no-floating-decimal': 'warn',
    'no-lonely-if': 'warn',
    'no-multi-assign': 'warn',
    'no-multiple-empty-lines': 'warn',
    'no-trailing-spaces': 'warn',
    'no-unneeded-ternary': 'warn',
    'no-unused-vars': 'off', // prefer @typescript-eslint/no-unused-vars
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        args: 'all',
        argsIgnorePattern: '^_|^props',
        ignoreRestSiblings: true
      }
    ],
    'no-whitespace-before-property': 'warn',
    'nonblock-statement-body-position': 'warn',
    'object-curly-newline': ['warn', { multiline: true, consistent: true }],
    'object-curly-spacing': ['warn', 'always'],
    'one-var': ['warn', 'never'],
    'operator-linebreak': ['warn', 'after'],
    'padded-blocks': ['warn', 'never'],
    'quote-props': ['warn', 'as-needed'],
    quotes: ['warn', 'single', { avoidEscape: true }],
    'space-before-blocks': 'warn',
    'space-before-function-paren': [
      'warn',
      { anonymous: 'never', named: 'never', asyncArrow: 'always' }
    ],
    'space-in-parens': 'warn',
    'space-infix-ops': 'warn',

    // ES6
    'arrow-parens': ['warn', 'as-needed'],
    'arrow-spacing': 'warn',
    'no-duplicate-imports': 'warn',
    'no-restricted-syntax': [
      'warn',
      { selector: 'TSEnumDeclaration', message: 'Use a union of literals instead of an enum' },
      { selector: 'JSXElement', message: 'Use react-hyperscript-helpers instead of JSX' }
    ],
    // TODO: Set 'variables' to 'true' after fixing the existing issues
    'no-use-before-define': ['warn', { functions: true, classes: true, variables: false }],
    'no-useless-rename': 'warn',
    'no-var': 'warn',
    'object-shorthand': 'warn',
    'prefer-arrow-callback': 'warn',
    'prefer-const': 'warn',
    'prefer-template': 'warn',
    'prefer-rest-params': 'warn',
    'prefer-spread': 'warn',
    'rest-spread-spacing': 'warn',
    'template-curly-spacing': 'warn',
    'vars-on-top': 'warn',

    'lodash-fp/consistent-name': ['warn', '_'],
    'lodash-fp/no-argumentless-calls': 'warn',
    'lodash-fp/no-chain': 'warn',
    'lodash-fp/no-extraneous-args': 'warn',
    'lodash-fp/no-extraneous-function-wrapping': 'warn',
    'lodash-fp/no-extraneous-iteratee-args': 'warn',
    // 'lodash-fp/no-extraneous-partials': 'warn', // available in eslint-plugin-lodash-fp 2.2.0+
    'lodash-fp/no-partial-of-curried': 'warn',
    'lodash-fp/no-single-composition': 'warn',
    'lodash-fp/no-submodule-destructuring': 'warn',
    'lodash-fp/no-unused-result': 'warn',
    'lodash-fp/prefer-compact': 'warn',
    'lodash-fp/prefer-composition-grouping': 'warn',
    'lodash-fp/prefer-flat-map': 'warn',
    'lodash-fp/prefer-get': 'warn',
    'lodash-fp/prefer-identity': ['warn', { arrowFunctions: false }],
    'lodash-fp/preferred-alias': 'warn',
    'lodash-fp/use-fp': 'warn',

    'react/default-props-match-prop-types': 'warn',
    'react/no-children-prop': 'warn',
    'react/no-unused-state': 'warn',

    'react-hooks/rules-of-hooks': 'warn',
    'react-hooks/exhaustive-deps': 'warn',

    'simple-import-sort/imports': 'warn',

    'import/named': 'warn',
    'import/newline-after-import': ['warn', { count: 2 }],
    'import/no-anonymous-default-export': ['warn', { allowObject: true }],
    'import/no-internal-modules': [
      'warn',
      {
        forbid: ['src/components/common/*']
      }
    ],
    'import/no-unresolved': 'warn',

    'no-debugger': 'warn',
    //new rules
    'no-alert': 0,
    'arrow-body-style': [2, 'as-needed'],
    'no-unused-expressions': [
      2,
      {
        allowTaggedTemplates: true
      }
    ],
    'no-param-reassign': [
      2,
      {
        props: false
      }
    ],
    'no-console': ['warn', { allow: ['assert', 'error'] }],
    'import/prefer-default-export': 1,
    'func-names': 0,
    'max-len': 0,
    'import/extensions': 0,
    'no-underscore-dangle': 0,
    'consistent-return': 0,
    'react/display-name': 1,
    'react/no-array-index-key': 0,
    'react/react-in-jsx-scope': 0,
    'react/prefer-stateless-function': 0,
    'react/forbid-prop-types': 0,
    'react/jsx-props-no-spreading': 0,
    'react/no-unescaped-entities': 0,
    'react/require-default-props': 0,
    // "react/jsx-filename-extension": [
    //   1,
    //   {
    //     "extensions": [
    //       ".js",
    //       ".jsx",
    //       ".ts",
    //       ".tsx"
    //     ]
    //   }
    // ],
    radix: 0,
    'no-shadow': 'off',
    'prettier/prettier': [
      'error',
      {
        trailingComma: 'none',
        singleQuote: true,
        printWidth: 100
      }
    ]
  }
};
