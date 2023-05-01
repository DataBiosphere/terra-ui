module.exports = {
  extends: ["airbnb-typescript-prettier"],
  parserOptions: {
    project: "./tsconfig.json",
  },
  settings: {
    "import/resolver": {
      "eslint-import-resolver-custom-alias": {
        alias: {
          src: "./src",
          types: "./types",
        },
        extensions: [".js", ".ts"],
      },
    },
  },
  rules: {
    indent: "off",
    "comma-dangle": "off",
    "import/prefer-default-export": "off",
    "simple-import-sort/imports": "warn",
    quotes: [2, "single", { avoidEscape: true }],
    "prettier/prettier": ["error", { singleQuote: true }],

    // TODO: ticket all of these to be enabled or explain why they are disabled
    "react/destructuring-assignment": "off",
    "react/forbid-prop-types": "off",
    "react/hooks/exhaustive-deps": "off",
    "react/prop-types": "off",
    "react/require-default-props": "off",
    "react/sort-comp": "off",
    "react/static-property-placement": "off",

    "import/extensions": "off",
    "import/named": "off",
    "import/no-cycle": "off",
    "import/no-extraneous-dependencies": "off",
    "import/no-named-as-default": "off",
    "import/no-named-as-default-member": "off",
    "import/no-relative-parent-imports": "off",

    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/ban-types": "off",
    "@typescript-eslint/default-param-last": "off",
    "@typescript-eslint/naming-convention": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-explicit-any": ["off"],
    "@typescript-eslint/no-implied-eval": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-shadow": "off",
    "@typescript-eslint/no-throw-literal": "off",
    "@typescript-eslint/no-unused-expressions": "off",
    "@typescript-eslint/no-use-before-define": "off",
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/return-await": "off",
    "@typescript-eslint/strict-boolean-expressions": "off", // TODO: should be 'warn',

    "class-methods-use-this": "off",
    "consistent-return": "off",
    "default-param-last": "off",
    "func-names": "off",
    "implicit-arrow-linebreak": "off",
    "max-len": "off", // TODO: should be: ['warn', { code: 120 }],
    "no-await-in-loop": "off",
    "no-case-declarations": "off",
    "no-constant-condition": "off",
    "no-console": "off",
    "no-dupe-keys": "off",
    "no-empty": "off",
    "no-continue": "off",
    "no-nested-ternary": "off",
    "no-param-reassign": "off",
    "no-plusplus": "off",
    "no-promise-executor-return": "off",
    "no-restricted-syntax": "off",
    "no-return-await": "off",
    "no-undef": "off",
    "no-underscore-dangle": "off",
    "no-unused-expressions": "off",
    "no-void": "off",
    "operator-linebreak": "off",
    "prefer-destructuring": "off",
    "prefer-promise-reject-errors": "off",
    "prefer-regex-literals": "off",
    radix: "off",
    "symbol-description": "off",
    //

    "no-unsafe-optional-chaining": "warn",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        vars: "all",
        args: "all",
        argsIgnorePattern: "_|^_|^props",
        ignoreRestSiblings: true,
      },
    ],
  },
  overrides: [
    {
      files: ["**/*.test.ts", "**/*.test.js"],
      env: {
        jest: true,
      },
    },
    {
      files: "src/**/*.{js,ts}",
      rules: {
        // 'no-console': ['warn', { allow: ['assert', 'error'] }],//TODO: should be enabled
      },
    },
  ],
  plugins: ["lodash-fp", "simple-import-sort"],
};
