import _ from 'lodash'
import { Fragment } from 'react'
import { a, div, h } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import { contextBar, contextMenu } from 'src/components/common'
import { breadcrumb, icon, spinner } from 'src/components/icons'
import ShowOnClick from 'src/components/ShowOnClick'
import { TopBar } from 'src/components/TopBar'
import { Rawls } from 'src/libs/ajax'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import WorkspaceDashboard from 'src/pages/workspaces/workspace/Dashboard'
import WorkspaceData from 'src/pages/workspaces/workspace/Data'
import WorkspaceNotebooks from 'src/pages/workspaces/workspace/Notebooks'
import WorkspaceTools from 'src/pages/workspaces/workspace/Tools'


const navSeparator = div({
  style: { background: 'rgba(255,255,255,0.15)', width: 1, height: '3rem', flexShrink: 0 }
})

const tabBaseStyle = {
  maxWidth: 140, flexGrow: 1, color: Style.colors.textFadedLight, textDecoration: 'none'
}

const tabActiveStyle = _.defaults({
  backgroundColor: 'rgba(255,255,255,0.15)', color: 'unset', lineHeight: 'calc(3.5rem - 4px)',
  borderBottom: `4px solid ${Style.colors.secondary}`
}, tabBaseStyle)

const navIconProps = {
  size: 22,
  style: { opacity: 0.65, paddingRight: '1rem' },
  hover: { opacity: 1 }, focus: 'hover'
}

const tabComponents = {
  dashboard: WorkspaceDashboard,
  notebooks: WorkspaceNotebooks,
  data: WorkspaceData,
  jobs: () => div('Job manager goes here'),
  history: () => div('Data history goes here'),
  tools: WorkspaceTools
}

/**
 * @param {string} namespace
 * @param {string} name
 * @param {string} [activeTab]
 */
export class WorkspaceContainer extends Component {
  constructor(props) {
    super(props)

    this.state = {
      forceUpdateKey: 0
    }
  }

  componentWillMount() {
    this.loadWorkspace()
  }

  loadWorkspace() {
    const { namespace, name } = this.props

    Rawls.workspaceDetails(namespace, name).then(
      workspace => this.setState({ workspace }),
      workspaceFailure => this.setState({ workspaceFailure })
    )
  }

  render() {
    const { namespace, name } = this.props
    const activeTab = this.props.activeTab || 'dashboard'

    const { forceUpdateKey, workspaceFailure, workspace } = this.state

    const navTab = tabName => {
      return h(Fragment, [
        a({
          style: tabName === activeTab ? tabActiveStyle : tabBaseStyle,
          href: Nav.getLink('workspace', namespace, name,
            tabName === 'dashboard' ? null : tabName),
          onClick: () => {
            if (tabName === activeTab) {
              this.loadWorkspace()
              this.setState({ forceUpdateKey: forceUpdateKey + 1 })
            }
          }
        }, tabName),
        navSeparator
      ])
    }

    return h(Fragment, [
      h(TopBar, { title: 'Projects' }, [
        div({ style: { display: 'flex', flexDirection: 'column', paddingLeft: '4rem' } },
          [
            a({
                style: { color: Style.colors.textFaded, cursor: 'pointer', textDecoration: 'none' },
                href: Nav.getLink('workspaces')
              },
              ['Projects', breadcrumb()]),
            a({
              style: { fontSize: '1.25rem', textDecoration: 'none', color: 'unset' },
              href: Nav.getLink('workspace', namespace, name)
            }, `${namespace}/${name}`)
          ])
      ]),
      contextBar({
        style: {
          paddingLeft: '5rem', borderBottom: `5px solid ${Style.colors.secondary}`,
          textAlign: 'center', color: 'white', lineHeight: '3.5rem', textTransform: 'uppercase'
        }
      }, [
        navSeparator,
        navTab('dashboard'), navTab('notebooks'), navTab('data'), navTab('jobs'),
        navTab('history'), navTab('tools'),
        div({ style: { flexGrow: 1 } }),
        h(Interactive,
          _.merge({ as: icon('copy') }, navIconProps)),
        h(ShowOnClick, {
            button: h(Interactive,
              _.merge({ as: icon('ellipsis-vertical') }, navIconProps))
          },
          [
            div({
              style: {
                position: 'absolute', right: 0, lineHeight: 'initial', textAlign: 'initial',
                color: 'initial', textTransform: 'initial', fontWeight: 300
              }
            }, [
              contextMenu([
                [{}, 'Share'],
                [{}, 'Publish'],
                [{}, 'Delete']
              ])
            ])
          ]
        )
      ]),
      Utils.cond(
        [workspaceFailure, `Couldn't load workspace: ${workspaceFailure}`],
        [!workspace, () => spinner({ style: { marginTop: '2rem' } })],
        () => h(tabComponents[activeTab], _.merge({ key: forceUpdateKey }, workspace))
      )
    ])
  }
}

export const addNavPaths = () => {
  Nav.defPath(
    'workspace',
    {
      component: WorkspaceContainer,
      regex: /workspaces\/([^/]+)\/([^/]+)\/?([^/]*)/,
      makeProps: (namespace, name, activeTab) => ({ namespace, name, activeTab }),
      makePath: (namespace, name, activeTab) =>
        `workspaces/${namespace}/${name}${activeTab ? `/${activeTab}` : ''}`
    }
  )
}
