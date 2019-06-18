import _ from 'lodash/fp'
import Prism from 'prismjs'
import PropTypes from 'prop-types'
import { code, pre } from 'react-hyperscript-helpers'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'


Prism.languages.wdl = {
  'embedded-code': [
    {
      /*
       * Note the space before the close '}' -- this is to not match on ${these} within
       * a command block using braces.
       * Janky, but we can't do better in regex.                      Here ↓ I mean
       */
      pattern: /(command\s*<<<)(?:.|\n)*?(?=>>>)|(command\s*{)(?:.|\n)*?(?=\s})/m,
      lookbehind: true,
      inside: {
        'embedded-python': {
          pattern: /(python[0-9]?\s*<<CODE)(?:.|\n)*?(?=CODE)/m,
          lookbehind: true,
          inside: {
            rest: Prism.languages.python
          }
        },
        rest: Prism.languages.bash
      }
    }
  ],
  comment: /#.*/,
  string: {
    pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
    greedy: true
  },
  declaration: {
    pattern: /(?:Array[\S]*|Boolean|File|Float|Int|Map|Object|String|Uri)\??\s+[A-Za-z_0-9]+/,
    inside: {
      builtin: /(?:Array[\S]*|Boolean|File|Float|Int|Map|Object|String|Uri)\??/,
      variable: / [A-Za-z_0-9]+/
    }
  },
  'class-name': [
    {
      // For workflow/task declarations and their invocations, must be before 'keyword' for lookbehind to work
      pattern: /((?:workflow|task|call) )[A-Za-z_]+/,
      lookbehind: true
    },
    // Must be after 'declaration' or this will grab "scatter" in variable names
    /\bscatter\b/
  ],
  keyword: /\b(?:import|as|input|output|call|command|runtime|task|workflow)\b/,
  boolean: /\b(?:true|false)\b/,
  number: /\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/i,
  operator: /=|\+=|-=|\*=|\/=|\/\/=|%=|&=|\|=|\^=|>>=|<<=|\*\*=|<=|>=|==|<|>|!=|\+|-|\*|\*\*|\/|\/\/|%|<<|>>|&|\||\^|~/,
  punctuation: /[{}[\];(),.:]/
}


export default class WDLViewer extends Component {
  static propTypes = {
    wdl: PropTypes.string.isRequired
  }

  render() {
    const { wdl, ...props } = this.props

    return pre(_.merge(
      {
        className: 'line-numbers',
        style: { border: Style.standardLine, backgroundColor: 'white' }
      },
      props),
    [
      code({ className: 'language-wdl', ref: r => this.elem = r }, [wdl])
    ])
  }

  componentDidMount() {
    Prism.highlightElement(this.elem)
  }

  componentDidUpdate() {
    Prism.highlightElement(this.elem)
  }
}
