import { Component, Fragment } from 'react'
import { a, div, h } from 'react-hyperscript-helpers'
import * as Ajax from 'src/libs/ajax'
import { topBar } from 'src/components/common'
import { breadcrumb } from 'src/components/icons'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import WorkspaceData from 'src/pages/workspaces/workspace/Data'


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

    const navSeparator = div({
      style: {
        background: 'rgba(255,255,255,0.15)', width: 1, height: '3rem',
        flexShrink: 0
      }
    })


    const navTab = (name, isActive = false) => {
      return h(Fragment, [
        div({
          style: {
            backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : null,
            opacity: isActive ? 1 : 0.65,
            borderBottom: isActive ? `8px solid ${Style.colors.secondary}` : 'none',
            maxWidth: 140, flexGrow: 1
          }
        }, name),
        navSeparator
      ])
    }

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
      div({
        style: {
          display: 'flex', height: '4rem', paddingLeft: '5rem', textAlign: 'center',
          backgroundColor: Style.colors.primary, color: 'white', lineHeight: '4rem',
          textTransform: 'uppercase', alignItems: 'center',
          borderBottom: `5px solid ${Style.colors.secondary}`
        }
      }, [
        navSeparator,
        navTab('Dashboard'), navTab('Notebooks'), navTab('Data', true), navTab('Jobs'),
        navTab('History'), navTab('Tools')
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
