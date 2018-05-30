import _ from 'lodash/fp'
import { Fragment } from 'react'
import { a, div, h } from 'react-hyperscript-helpers/lib/index'
import Interactive from 'react-interactive'
import ClusterManager from 'src/components/ClusterManager'
import { contextBar, contextMenu } from 'src/components/common'
import { icon } from 'src/components/icons'
import ShowOnClick from 'src/components/ShowOnClick'
import { TopBar } from 'src/components/TopBar'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


const navSeparator = div({
  style: { background: 'rgba(255,255,255,0.15)', width: 1, height: '3rem', flexShrink: 0 }
})

const tabBaseStyle = {
  maxWidth: 140, flexGrow: 1, color: Style.colors.textFadedLight, textDecoration: 'none',
  alignSelf: 'stretch', display: 'flex', justifyContent: 'center', alignItems: 'center'
}

const tabActiveStyle = {
  ...tabBaseStyle,
  backgroundColor: 'rgba(255,255,255,0.15)', color: 'unset',
  borderBottom: `4px solid ${Style.colors.secondary}`
}

const navTab = (tabName, { namespace, name, activeTab, refresh }) => {
  const selected = tabName === activeTab

  return h(Fragment, [
    a({
      style: selected ? tabActiveStyle : tabBaseStyle,
      onClick: selected ? refresh : undefined, // Warning when passed 'false'
      href: Utils.cond(
        [tabName === 'dashboard', () => Nav.getLink('workspace', { namespace, name })],
        // because not all tabs are implemented:
        [_.includes(tabName, ['notebooks', 'data', 'tools']), () => Nav.getLink(`workspace-${tabName.toLowerCase()}`, { namespace, name })],
        () => undefined
      )
    }, tabName),
    navSeparator
  ])
}

const navIconProps = {
  size: 22,
  style: { opacity: 0.65, marginRight: '1rem' },
  hover: { opacity: 1 }, focus: 'hover'
}


const tabBar = props => contextBar(
  {
    style: {
      paddingLeft: '5rem', borderBottom: `5px solid ${Style.colors.secondary}`,
      textAlign: 'center', color: 'white', lineHeight: '3.75rem', textTransform: 'uppercase'
    }
  },
  [
    navSeparator,
    navTab('dashboard', props), navTab('notebooks', props), navTab('data', props), navTab('jobs', props),
    navTab('history', props), navTab('tools', props),
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
    ])
  ]
)


export default class WorkspaceContainer extends Component {
  render() {
    const { namespace, name, breadcrumbs, title, activeTab, refresh } = this.props
    const tabProps = { namespace, name, activeTab, refresh }

    return div({ style: { display: 'flex', flexDirection: 'column', height: '100%', flexGrow: 1 } }, [
      h(TopBar, { title: 'Projects' }, [
        div({ style: { display: 'flex', flexDirection: 'column', paddingLeft: '4rem' } },
          [
            div({}, breadcrumbs),
            div({ style: { fontSize: '1.25rem' } }, [title || `${namespace}/${name}`])
          ]),
        h(ClusterManager, { namespace })
      ]),
      tabBar(tabProps),
      this.props.children
    ])
  }
}
