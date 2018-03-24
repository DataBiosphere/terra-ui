import _ from 'lodash'
import { Component } from 'react'
import { div, hh } from 'react-hyperscript-helpers/lib/index'
import { spinner } from 'src/components/icons'
import * as Ajax from 'src/libs/ajax'
import * as Style from 'src/libs/style'
import Modal from 'src/components/Modal'
import { buttonPrimary } from 'src/components/common'


export default hh(class WorkspaceDashboard extends Component {
  constructor(props) {
    super(props)
    this.state = {
      workspace: null
    }
  }


  componentWillMount() {
    const { namespace, name } = this.props
    Ajax.workspace.details(namespace, name,
      workspace => this.setState({ workspace }),
      failure => this.setState({ failure }))
  }


  render() {
    const { workspace, failure } = this.state

    return _.isEmpty(workspace) ?
      failure ?
        `Couldn't load workspace details: ${failure}` :
        spinner({ style: { marginTop: '1rem' } }) :
      div({ style: { margin: '1rem' } }, [
        div({ style: { fontSize: 16, fontWeight: 500, color: Style.colors.title } },
          'ACCESS LEVEL'),
        workspace['accessLevel'],
        Modal({button: buttonPrimary({}, 'test'), title: 'hi!'})
      ])
  }
})
