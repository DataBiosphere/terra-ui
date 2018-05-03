import CodeMirror from 'codemirror'
import _ from 'lodash'
import { textarea } from 'react-hyperscript-helpers'
import { Component } from 'src/libs/wrapped-components'


export default class WDLViewer extends Component {
  constructor(props) {
    super(props)
    this.id = _.uniqueId()
  }

  render() {
    return textarea({ id: this.id }, this.props.wdl)
  }

  componentDidMount() {
    CodeMirror.fromTextArea(document.getElementById(this.id), { mode: 'shell' })
  }
}
