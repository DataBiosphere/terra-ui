import _ from 'lodash'
import { Component, Fragment } from 'react'
import { a, div, h, hh } from 'react-hyperscript-helpers'
import { contextBar, TopBar } from 'src/components/common'
import { breadcrumb, icon } from 'src/components/icons'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import WorkspaceDashboard from 'src/pages/workspaces/workspace/Dashboard'
import WorkspaceData from 'src/pages/workspaces/workspace/Data'
import WorkspaceNotebooks from 'src/pages/workspaces/workspace/Notebooks'


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

const navIcon = shape => {
  return icon(shape, { size: 22, style: { opacity: 0.65, paddingRight: '1rem' } })
}

const tabComponents = {
  dashboard: WorkspaceDashboard,
  notebooks: WorkspaceNotebooks,
  data: WorkspaceData,
  jobs: () => div('when we get to it'),
  history: () => div('okay, this is _data_ history, whatever that means'),
  tools: () => div('These are totally Not Method Configs')
}

/**
 * @param {string} namespace
 * @param {string} name
 * @param {string} [activeTab]
 */
const WorkspaceContainer = hh(class WorkspaceContainer extends Component {
  constructor(props) {
    super(props)

    this.state = {
      forceUpdateKey: 0
    }
  }

  render() {
    const { namespace, name } = this.props
    const activeTab = this.props.activeTab || 'dashboard'

    const { forceUpdateKey } = this.state

    const navTab = tabName => {
      return h(Fragment, [
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

    return h(Fragment, [
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
        navIcon('copy'), navIcon('ellipsis-vertical')
      ]),
      tabComponents[activeTab]({ namespace, name, key: forceUpdateKey })
    ])
  }
})

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
