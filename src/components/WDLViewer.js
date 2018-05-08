import CodeMirror from 'codemirror'
import { div } from 'react-hyperscript-helpers'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'


CodeMirror.defineMode('wdl', function() {
  return {
    token: stream => {
      stream.eatSpace()
      if (stream.match(/#.*/)) {
        return 'comment'
      } else if (stream.match(/"(?:[^"\\]|\\.)*"/) || stream.match(/'(?:[^'\\]|\\.)*'/)) {
        return 'string'
      } else if (stream.match(/(?:import|as|true|false|input|output|call|command|runtime|task|workflow)\b/)) {
        return 'keyword'
      } else if (stream.match(/(?:Array|Boolean|File|Float|Int|Map|Object|String|Uri)\b/)) {
        return 'builtin'
      } else if (stream.match(/[A-Za-z_][A-Za-z0-9_]*/)) {
        return 'variable'
      } else if (stream.match(/\${.*?}/)) {
        return 'variable-3'
      } else if (stream.match(/[{}]/)) {
        return 'bracket'
      } else if (stream.match(/[0-9]*\.?[0-9]+/)) {
        return 'number'
      } else {
        stream.next()
      }
    }
  }
})


export default class WDLViewer extends Component {
  render() {
    return div({ ref: elem => this.container = elem, style: { border: Style.standardLine } })
  }

  componentDidMount() {
    CodeMirror(this.container, { mode: 'wdl', value: this.props.wdl, lineNumbers: true })
  }
}
