import _ from 'lodash'
import { Component } from 'react'
import { div, hh } from 'react-hyperscript-helpers/lib/index'
import { spinner } from 'src/components/icons'
import * as Ajax from 'src/libs/ajax'
import * as Style from 'src/libs/style'


export default hh(class WorkspaceDashboard extends Component {
  constructor(props) {
    super(props)
    this.state = {
      workspace: null
    }
  }


  componentWillMount() {
    const { namespace, name } = this.props

    Ajax.rawls(`workspaces/${namespace}/${name}`).then(json =>
      this.setState({ workspace: json })
    )
  }


  render() {
    const { workspace } = this.state

    return _.isEmpty(workspace) ? spinner({ style: { marginTop: '1rem' } }) :
      div({ style: { margin: '1rem' } }, [
        div({ style: { fontSize: 16, fontWeight: 500, color: Style.colors.title } },
          'ACCESS LEVEL'),
        workspace['accessLevel']
      ])
  }
})
