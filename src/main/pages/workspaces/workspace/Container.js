import _ from 'lodash'
import { a, div, hh } from 'react-hyperscript-helpers'
import { contextBar, contextMenu } from 'src/main/components/common'
import { breadcrumb, icon, spinner } from 'src/main/components/icons'
import { TopBar } from 'src/main/components/TopBar'
import ShowOnClick from 'src/main/components/ShowOnClick'
import * as Nav from 'src/main/libs/nav'
import * as Style from 'src/main/libs/style'
import * as Utils from 'src/main/libs/utils'
import { Component, Fragment, Interactive } from 'src/main/libs/wrapped-components'
import WorkspaceDashboard from 'src/main/pages/workspaces/workspace/Dashboard'
import WorkspaceData from 'src/main/pages/workspaces/workspace/Data'
import WorkspaceNotebooks from 'src/main/pages/workspaces/workspace/Notebooks'
import WorkspaceTools from 'src/main/pages/workspaces/workspace/Tools'
import { Rawls } from 'src/main/libs/ajax'


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
  hover: { opacity: 1, cursor: 'pointer' }, focus: 'hover'
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
export const WorkspaceContainer = hh(class WorkspaceContainer extends Component {
  constructor(props) {
    super(props)

    this.state = {
      forceUpdateKey: 0
    }
  }

  componentWillMount() {
    const { namespace, name, Rawls } = this.props

    Rawls.workspaceDetails(namespace, name, workspace => this.setState({ workspace }),
      workspaceFailure => this.setState({ workspaceFailure }))
  }

  render() {
    const { namespace, name } = this.props
    const activeTab = this.props.activeTab || 'dashboard'

    const { forceUpdateKey, workspaceFailure, workspace } = this.state

    const navTab = tabName => {
      return Fragment([
        a({
          style: tabName === activeTab ? tabActiveStyle : tabBaseStyle,
          href: Nav.getLink('workspace', namespace, name,
            tabName === 'dashboard' ? null : tabName),
          onClick: () => {
            if (tabName === activeTab) {
              this.setState({ forceUpdateKey: forceUpdateKey + 1 })
            }
          }
        }, tabName),
        navSeparator
      ])
    }

    return Fragment([
      TopBar({ title: 'Projects' }, [
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
        Interactive(
          _.merge({ as: icon('copy') }, navIconProps)),
        ShowOnClick({
            containerProps: { style: { position: 'relative' } },
            button: Interactive(
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
        () => tabComponents[activeTab](_.merge({ key: forceUpdateKey }, workspace))
      )
    ])
  }
})

export const addNavPaths = () => {
  Nav.defPath(
    'workspace',
    {
      component: WorkspaceContainer,
      regex: /workspaces\/([^/]+)\/([^/]+)\/?([^/]*)/,
      makeProps: (namespace, name, activeTab) => ({ namespace, name, activeTab, Rawls }),
      makePath: (namespace, name, activeTab) =>
        `workspaces/${namespace}/${name}${activeTab ? `/${activeTab}` : ''}`
    }
  )
}
