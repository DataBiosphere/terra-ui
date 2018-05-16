import _ from 'lodash'
import Prism from 'prismjs'
import 'prismjs/themes/prism.css'
import 'prismjs/plugins/line-numbers/prism-line-numbers'
import 'prismjs/plugins/line-numbers/prism-line-numbers.css'
import { code, pre } from 'react-hyperscript-helpers'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'


Prism.languages.wdl = {
  comment: /#.*/,
  string: {
    pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
    greedy: true
  },
  declaration: {
    pattern: /(?:Array[\S]*|Boolean|File|Float|Int|Map|Object|String|Uri)\??\s+[A-Za-z_]+/,
    inside: {
      builtin: /(?:Array[\S]*|Boolean|File|Float|Int|Map|Object|String|Uri)\??/,
      variable: / [A-Za-z_]+/
    }
  },
  'class-name': [
    {
      // For workflow/task declarations and their invocations, must be before 'keyword' for lookbehind to work
      pattern: /((?:workflow|task|call) )[A-Za-z_]+/,
      lookbehind: true
    },
    // Must be after 'declaration' or this will grab "scatter" in variable names
    /scatter/
  ],
  keyword: /\b(?:import|as|true|false|input|output|call|command|runtime|task|workflow)\b/,
  boolean: /\b(?:true|false)\b/,
  number: /\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/i,
  operator: /=|\+=|-=|\*=|\/=|\/\/=|%=|&=|\|=|\^=|>>=|<<=|\*\*=|<=|>=|==|<|>|!=|\+|-|\*|\*\*|\/|\/\/|%|<<|>>|&|\||\^|~/,
  punctuation: /[{}[\];(),.:]/
}


export default class WDLViewer extends Component {
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
}
