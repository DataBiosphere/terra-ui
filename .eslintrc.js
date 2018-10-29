module.exports = {
  'plugins': ['lodash-fp', 'react'],
  'extends': 'react-app',
  'globals': {
    'SATURN_VERSION': false,
    'SATURN_BUILD_TIMESTAMP': false
  },
  'parserOptions': {
    'ecmaFeatures': {
      'jsx': false
    }
  },
  'settings': {
    'react': {
      'version': '16.5.2'
    }
  },
  'rules': {
    'array-bracket-newline': ['warn', 'consistent'],
    'array-bracket-spacing': 'warn',
    'block-spacing': 'warn',
    'brace-style': ['warn', '1tbs', { 'allowSingleLine': true }],
    'camelcase': 'warn',
    'comma-dangle': 'warn',
    'comma-spacing': 'warn',
    'comma-style': 'warn',
    'computed-property-spacing': 'warn',
    'eol-last': 'warn',
    'func-call-spacing': 'warn',
    'implicit-arrow-linebreak': 'warn',
    'indent': ['warn', 2, { 'SwitchCase': 1, 'CallExpression': { 'arguments': 1 } }],
    'key-spacing': 'warn',
    'keyword-spacing': 'warn',
    'lines-between-class-members': 'warn',
    'no-lonely-if': 'warn',
    'no-multi-assign': 'warn',
    'no-multiple-empty-lines': 'warn',
    'no-trailing-spaces': 'warn',
    'no-unneeded-ternary': 'warn',
    'no-whitespace-before-property': 'warn',
    'nonblock-statement-body-position': 'warn',
    'object-curly-newline': ['warn', { 'multiline': true, 'consistent': true }],
    'object-curly-spacing': ['warn', 'always'],
    'one-var': ['warn', 'never'],
    'padded-blocks': ['warn', 'never'],
    'quotes': ['warn', 'single', { 'allowTemplateLiterals': true }],
    'semi': ['warn', 'never'],
    'space-before-blocks': 'warn',
    'space-before-function-paren': ['warn', { 'anonymous': 'never', 'named': 'never', 'asyncArrow': 'always' }],
    'space-in-parens': 'warn',


    'arrow-parens': ['warn', 'as-needed'],
    'arrow-spacing': 'warn',
    'no-duplicate-imports': 'warn',
    'no-var': 'warn',
    'prefer-arrow-callback': 'warn',
    'prefer-const': 'warn',
    'prefer-rest-params': 'warn',
    'prefer-spread': 'warn',
    'rest-spread-spacing': 'warn',
    'template-curly-spacing': 'warn',


    'lodash-fp/consistent-name': ['warn', '_'],
    'lodash-fp/no-argumentless-calls': 'warn',
    'lodash-fp/no-chain': 'warn',
    'lodash-fp/no-extraneous-args': 'warn',
    'lodash-fp/no-partial-of-curried': 'warn',
    'lodash-fp/no-single-composition': 'warn',
    'lodash-fp/no-submodule-destructuring': 'warn',
    'lodash-fp/no-unused-result': 'warn',
    'lodash-fp/prefer-compact': 'warn',
    'lodash-fp/prefer-composition-grouping': 'warn',
    'lodash-fp/prefer-flat-map': 'warn',
    'lodash-fp/prefer-get': 'warn',
    'lodash-fp/prefer-identity': ['warn', { 'arrowFunctions': false }],
    'lodash-fp/preferred-alias': 'warn',
    'lodash-fp/use-fp': 'warn',


    'react/default-props-match-prop-types': 'warn',
    'react/no-children-prop': 'warn',
    'react/no-unused-state': 'warn'
  }
}
