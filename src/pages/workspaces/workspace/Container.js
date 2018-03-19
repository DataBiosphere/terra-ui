import _ from 'lodash'
import { Component, Fragment } from 'react'
import { a, div, h, hh } from 'react-hyperscript-helpers'
import { contextBar, TopBar } from 'src/components/common'
import { breadcrumb, icon } from 'src/components/icons'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import WorkspaceData from 'src/pages/workspaces/workspace/Data'


const navSeparator = div({
  style: {
    background: 'rgba(255,255,255,0.15)', width: 1, height: '3rem',
    flexShrink: 0
  }
})

const tabBaseStyle = {
  maxWidth: 140, flexGrow: 1, color: Style.colors.textFadedLight, textDecoration: 'none'
}

const tabActiveStyle = _.defaults({
  backgroundColor: 'rgba(255,255,255,0.15)',
  color: 'white',
  lineHeight: 'calc(3.5rem - 4px)',
  borderBottom: `4px solid ${Style.colors.secondary}`
}, tabBaseStyle)

const navIcon = shape => {
  return icon(shape, { size: 22, style: { opacity: 0.65, paddingRight: '1rem' } })
}

/**
 * @param {string} name
 * @param {string} namespace
 * @param {string} [tab]
 */
const WorkspaceContainer = hh(class WorkspaceContainer extends Component {
  render() {
    const { namespace, name, activeTab = 'dashboard' } = this.props

    const navTab = tabName => {
      return h(Fragment, [
        a({
          style: tabName === activeTab ? tabActiveStyle : tabBaseStyle,
          href: Nav.getLink('workspaceTab', namespace, name, tabName)
        }, tabName),
        navSeparator
      ])
    }

    const getActiveComponent = () => {
      const tabComponents = {
        data: WorkspaceData
      }
      return tabComponents[activeTab] || WorkspaceData
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
            div({ style: { fontSize: '1.25rem' } }, `${namespace}/${name}`)
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
      getActiveComponent()({ namespace, name })
    ])
  }
})

export const addNavPaths = () => {
  Nav.defPath(
    'workspace',
    {
      component: WorkspaceContainer,
      regex: /workspaces\/([^/]+)\/([^/]+)$/,
      makeProps: (namespace, name) => ({ namespace, name }),
      makePath: (namespace, name) => `workspaces/${namespace}/${name}`
    }
  )

  Nav.defPath(
    'workspaceTab',
    {
      component: WorkspaceContainer,
      regex: /workspaces\/([^/]+)\/([^/]+)\/([^/]+)/,
      makeProps: (namespace, name, activeTab) => ({ namespace, name, activeTab: activeTab }),
      makePath: (namespace, name, activeTab) => `workspaces/${namespace}/${name}/${activeTab}`
    }
  )

}
