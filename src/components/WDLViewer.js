import Editor from '@monaco-editor/react';
// import Prism from 'prismjs';
import { div, h } from 'react-hyperscript-helpers';
import colors from 'src/libs/colors';

/*
 * The WDL Language team maintains a TextMate Grammar for WDL syntax, which
 * would be nice to use here. That grammar uses a flavor of regular expressions
 * parsed by the Oniguruma regular expression (C?) library, so isn't readily
 * available in the browser.
 *   Additionally, this Prism grammar supports embedded languages, which allows
 * accurate highlighting of the embedded Python. At the time of this writing,
 * that support isn't available in the WDL TextMate Grammar, perhaps because it
 * isn't possible.
 */
// Prism.languages.wdl = {
//   comment: /#.*/,
//   string: {
//     pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
//     greedy: true,
//   },
//   declaration: {
//     pattern: /(?:Array[\S]*|Boolean|File|Float|Int|Map|Object|String|Pair)\??\s+\w+/,
//     inside: {
//       builtin: /(?:Array[\S]*|Boolean|File|Float|Int|Map|Object|String|Pair)\??/,
//       variable: / \w+/,
//     },
//   },
//   'class-name': [
//     {
//       // For workflow/task declarations and their invocations, must be before 'keyword' for lookbehind to work
//       pattern: /((?:workflow|task|call)\s+)\w+/,
//       lookbehind: true,
//     },
//     // Must be after 'declaration' or this will grab "scatter" in variable names
//     /\bscatter\b/,
//   ],
//   // keywords before embeddable because of 'command'
//   keyword:
//     /\b(?:^version|call|runtime|task|workflow|if|then|else|import|as|input|output|meta|parameter_meta|scatter|struct|object(?=\s*{)|command(?=\s*(<<<|{)))\b/,
//   boolean: /\b(?:true|false)\b/,
//   number: /\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/i,
//   punctuation: /([{}[\];(),.:]|<<<|>>>)/, // before operators because of <<< & >>>
//   operator: /([=!*<>+-/%]|&&)/,
//   'embedded-code': [
//     {
//       /*
//        * Note the space before the close '}' -- this is to not match on ${these} within
//        * a command block using braces.
//        * Janky, but we can't do better in regex.                      Here ↓ I mean
//        */
//       pattern: /(command\s*<<<)(?:.|\n)*?(?=>>>)|(command\s*{)(?:.|\n)*?(?=\s})/m,
//       lookbehind: true,
//       inside: {
//         'embedded-python': {
//           pattern: /(python[0-9]?\s*<<CODE)(?:.|\n)*?(?=CODE)/m,
//           lookbehind: true,
//           inside: {
//             rest: Prism.languages.python,
//           },
//         },
//         rest: Prism.languages.bash,
//       },
//     },
//   ],
// };

const wdlMonarch = {
  keywords: [
    'version',
    'call',
    'runtime',
    'task',
    'workflow',
    'if',
    'then',
    'else',
    'import',
    'as',
    'input',
    'output',
    'meta',
    'parameter_meta',
    'scatter',
    'struct',
    'object',
    'command',
    'true',
    'false',
  ],

  typeKeywords: ['Array', 'Boolean', 'File', 'Float', 'Int', 'Map', 'Object', 'String', 'Pair'],

  operators: ['=', '!', '*', '<', '>', '+', '-', '/', '%', '&&'],

  symbols: /[=><!~?:&|+\-*/^%]+/,

  // C# style strings
  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  // The main tokenizer for our languages
  tokenizer: {
    root: [
      [/#.*/, 'comments'],
      [/(?:Array[\S]*|Boolean|File|Float|Int|Map|Object|String|Pair)\??\s+\w+/, 'declaration'],

      // identifiers and keywords
      [
        /[a-z_$][\w$]*/,
        {
          cases: {
            '@typeKeywords': 'keyword.type',
            '@keywords': 'keyword',
            '@default': 'identifier',
          },
        },
      ],
      [/[A-Z][\w$]*/, 'type.identifier'], // to show class names nicely

      // whitespace
      { include: '@whitespace' },

      // delimiters and operators
      [/[{}()[\]]/, '@brackets'],
      [/[<>](?!@symbols)/, '@brackets'],
      [
        /@symbols/,
        {
          cases: {
            '@operators': 'operator',
            '@default': '',
          },
        },
      ],

      // @ annotations.
      // As an example, we emit a debugging log message on these tokens.
      // Note: message are supressed during the first load -- change some lines to see them.
      [/@\s*[a-zA-Z_$][\w$]*/, { token: 'annotation', log: 'annotation token: $0' }],

      // numbers
      [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
      [/0[xX][0-9a-fA-F]+/, 'number.hex'],
      [/\d+/, 'number'],

      // delimiter: after number because of .\d floats
      [/[;,.]/, 'delimiter'],

      // strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'], // non-teminated string
      [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],

      // characters
      [/'[^\\']'/, 'string'],
      [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
      [/'/, 'string.invalid'],

      [/\b(?:true|false)\b/, '@keyword.boolean'],
    ],

    comment: [[/#.*/, 'comment']],

    string: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
    ],

    whitespace: [
      [/[ \t\r\n]+/, 'white'],
      [/\/\*/, 'comment', '@comment'],
      [/\/\/.*$/, 'comment'],
    ],
  },
};

const handleEditorWillMount = (monaco) => {
  // here is the monaco instance
  // do something before editor is mounted
  monaco.languages.register({
    id: 'wdl',
  });
  monaco.languages.setMonarchTokensProvider('wdl', wdlMonarch);
  monaco.editor.defineTheme('prism-likeTheme', {
    base: 'vs',
    inherit: false,
    rules: [
      {
        token: 'keyword',
        foreground: '#328fb9',
      },
      {
        token: 'keyword.type',
        foreground: '#63911f',
      },
      {
        token: 'identifier',
        foreground: '#d95c76',
      },
      {
        token: 'operator',
        foreground: '#c3a889',
      },
      {
        token: 'comments',
        foreground: '#90a4a9',
      },
      {
        token: 'number.float',
        foreground: '#9f115c',
      },
      {
        token: 'declaration',
        foreground: '#63911f',
      },
    ],
    colors: {},
  });
};

// A list of passable props can be found here: https://www.npmjs.com/package/@monaco-editor/react?activeTab=readme#props
const WDLViewer = ({ wdl, ...props }) => {
  return div({ style: { border: `1px solid ${colors.dark(0.55)}`, borderRadius: 4 } }, [
    h(Editor, {
      height: '300px',
      width: '100%',
      language: 'wdl',
      value: wdl,
      theme: 'prism-likeTheme',
      beforeMount: handleEditorWillMount,
      ...props,
    }),
  ]);
};

export default WDLViewer;
