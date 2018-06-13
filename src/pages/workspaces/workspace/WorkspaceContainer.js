import { Fragment } from 'react'
import { a, div, h } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import { pure } from 'recompose'
import ClusterManager from 'src/components/ClusterManager'
import { contextBar, contextMenu } from 'src/components/common'
import { icon } from 'src/components/icons'
import ShowOnClick from 'src/components/ShowOnClick'
import { TopBar } from 'src/components/TopBar'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'


const styles = {
  tabContainer: {
    paddingLeft: '5rem', borderBottom: `5px solid ${Style.colors.secondary}`,
    textAlign: 'center', color: 'white', lineHeight: '3.75rem', textTransform: 'uppercase'
  },
  menuContainer: {
    position: 'absolute', right: 0, lineHeight: 'initial', textAlign: 'initial',
    color: 'initial', textTransform: 'initial', fontWeight: 300
  },
  tab: {
    maxWidth: 140, flexGrow: 1, color: Style.colors.textFadedLight, textDecoration: 'none',
    alignSelf: 'stretch', display: 'flex', justifyContent: 'center', alignItems: 'center'
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.15)', color: 'unset',
    borderBottom: `4px solid ${Style.colors.secondary}`
  }
}

const navSeparator = div({
  style: { background: 'rgba(255,255,255,0.15)', width: 1, height: '3rem', flexShrink: 0 }
})

const navIconProps = {
  size: 22,
  style: { opacity: 0.65, marginRight: '1rem' },
  hover: { opacity: 1 }, focus: 'hover'
}


const WorkspaceTabs = pure(({ namespace, name, activeTab, refresh }) => {
  const navTab = ({ tabName, href }) => {
    const selected = tabName === activeTab
    return h(Fragment, [
      a({
        style: { ...styles.tab, ...(selected ? styles.activeTab : {}) },
        onClick: selected ? refresh : undefined,
        href
      }, tabName),
      navSeparator
    ])
  }
  return contextBar({ style: styles.tabContainer }, [
    navSeparator,
    navTab({ tabName: 'dashboard', href: Nav.getLink('workspace', { namespace, name }) }),
    navTab({ tabName: 'notebooks', href: Nav.getLink('workspace-notebooks', { namespace, name }) }),
    navTab({ tabName: 'data', href: Nav.getLink('workspace-data', { namespace, name }) }),
    navTab({ tabName: 'jobs' }),
    navTab({ tabName: 'history' }),
    navTab({ tabName: 'tools', href: Nav.getLink('workspace-tools', { namespace, name }) }),
    div({ style: { flexGrow: 1 } }),
    h(Interactive, { ...navIconProps, as: icon('copy') }),
    h(ShowOnClick, {
      button: h(Interactive, { ...navIconProps, as: icon('ellipsis-vertical') })
    }, [
      div({ style: styles.menuContainer }, [
        contextMenu([
          [{}, 'Share'],
          [{}, 'Publish'],
          [{}, 'Delete']
        ])
      ])
    ])
  ])
})


export default class WorkspaceContainer extends Component {
  render() {
    const { namespace, name, breadcrumbs, title, activeTab, refresh } = this.props

    return div({ style: { display: 'flex', flexDirection: 'column', height: '100%', flexGrow: 1 } }, [
      h(TopBar, { title: 'Projects' }, [
        div({ style: { display: 'flex', flexDirection: 'column', paddingLeft: '4rem' } },
          [
            div({}, breadcrumbs),
            div({ style: { fontSize: '1.25rem' } }, [title || `${namespace}/${name}`])
          ]),
        h(ClusterManager, { namespace })
      ]),
      h(WorkspaceTabs, { namespace, name, activeTab, refresh }),
      div({ style: { position: 'relative', flexGrow: 1 } }, [
        this.props.children
      ])
    ])
  }
}
