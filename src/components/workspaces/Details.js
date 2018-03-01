import { Component } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import * as Nav from '../../nav'


class WorkspaceDetails extends Component {
  render() {
    return div({}, [`${this.props.namespace}/${this.props.name}`])
  }
}


const addNavPaths = () => {
  Nav.defPath(
    'workspace',
    {
      component: props => h(WorkspaceDetails, props),
      regex: /workspaces\/([^/]+)\/([^/]+)/,
      makeProps: (namespace, name) => ({ namespace, name }),
      makePath: (namespace, name) => `workspaces/${namespace}/${name}`
    }
  )
}

export { addNavPaths }
