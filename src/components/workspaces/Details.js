import { Component } from 'react'
import { h } from 'react-hyperscript-helpers'
import * as Nav from '../../nav'


class WorkspaceDetails extends Component {
  render() {
    console.log(this.props)
    return `${this.props.namespace}/${this.props.name}`
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
