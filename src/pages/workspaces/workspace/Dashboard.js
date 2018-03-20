import _ from 'lodash'
import { Component, Fragment } from 'react'
import { div, h, hh } from 'react-hyperscript-helpers/lib/index'
import * as Ajax from 'src/libs/ajax'
import { spinner } from 'src/components/icons'
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

    return _.isEmpty(workspace) ? spinner() :
      div({style: {margin: '1rem'}}, [
        div({style: {fontSize: 16, fontWeight: 500, color: Style.colors.title}}, 'ACCESS LEVEL'),
        workspace['accessLevel']
      ])
  }
})
