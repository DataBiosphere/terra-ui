import _ from 'underscore'
import { Component, Fragment } from 'react'
import { a, div, h } from 'react-hyperscript-helpers'
import { contextBar, topBar } from 'src/components/common'
import { breadcrumb, icon } from 'src/components/icons'
import WorkspaceData from 'src/pages/workspaces/workspace/Data'
import * as Ajax from 'src/libs/ajax'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'


const navSeparator = div({
  style: {
    background: 'rgba(255,255,255,0.15)', width: 1, height: '3rem',
    flexShrink: 0
  }
})

const tabActiveState = {
  backgroundColor: 'rgba(255,255,255,0.15)',
  color: 'white',
  lineHeight: 'calc(3.5rem - 8px)',
  borderBottom: `8px solid ${Style.colors.secondary}`
}

const navTab = (name, isActive = false) => {
  return h(Fragment, [
    div({
      style: _.extend({ maxWidth: 140, flexGrow: 1, color: Style.colors.textFadedLight },
        isActive ? tabActiveState : {})
    }, name),
    navSeparator
  ])
}

const navIcon = shape => {
  return icon(shape, { size: 22, style: { opacity: 0.65, paddingRight: '1rem' } })
}

class WorkspaceContainer extends Component {
  constructor(props) {
    super(props)
    this.state = {
      workspaceEntities: {},
      selectedEntityType: '',
      selectedEntities: []
    }
  }

  componentWillMount() {
    const { namespace, name } = this.props

    Ajax.rawls(`workspaces/${namespace}/${name}`).then(json =>
      this.setState({ workspace: json })
    )

    Ajax.rawls(`workspaces/${namespace}/${name}/entities`).then(json =>
      this.setState({ workspaceEntities: json })
    )

  }

  render() {
    const { namespace, name } = this.props
    const { workspaceEntities } = this.state

    return h(Fragment, [
      topBar([
        div({ style: { display: 'flex', flexDirection: 'column', paddingLeft: '4rem' } },
          [
            a({
                style: { color: Style.colors.textFaded, cursor: 'pointer', textDecoration: 'none' },
                href: Nav.getLink('workspaces')
              },
              ['Projects', breadcrumb()]),
            div({ style: { color: Style.colors.text, fontSize: '1.25rem' } },
              `${namespace}/${name}`)
          ])
      ]),
      contextBar({
        style: {
          paddingLeft: '5rem', borderBottom: `5px solid ${Style.colors.secondary}`,
          textAlign: 'center', color: 'white', lineHeight: '3.5rem', textTransform: 'uppercase'
        }
      }, [
        navSeparator,
        navTab('Dashboard'), navTab('Notebooks'), navTab('Data', true), navTab('Jobs'),
        navTab('History'), navTab('Tools'), div({ style: { flexGrow: 1 } }),
        navIcon('copy'), navIcon('ellipsis-vertical')
      ]),
      WorkspaceData({ namespace, name, workspaceEntities })
    ])
  }
}


const addNavPaths = () => {
  Nav.defPath(
    'workspace',
    {
      component: props => h(WorkspaceContainer, props),
      regex: /workspaces\/([^/]+)\/([^/]+)/,
      makeProps: (namespace, name) => ({ namespace, name }),
      makePath: (namespace, name) => `workspaces/${namespace}/${name}`
    }
  )
}

export { addNavPaths }
