import _ from 'lodash/fp'
import { findDOMNode } from 'react-dom'
import { iframe } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { centeredSpinner } from 'src/components/icons'
import { ajaxCaller } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { Component } from 'src/libs/wrapped-components'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const TerminalLauncher = ajaxCaller(wrapWorkspace({
  breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
  title: () => `Terminal`,
  activeTab: 'notebooks'
},
class TerminalLauncherContent extends Component {
  async loadIframe() {
    const { clusters } = this.props
    const { url } = this.state

    if (clusters && !url) {
      try {
        const { clusterName, clusterUrl } = _.flow(
          _.remove({ status: 'Deleting' }),
          _.sortBy('createdDate'),
          _.last
        )(clusters)
        await this.refreshCookie(clusterName)
        this.setState({ url: `${clusterUrl}/terminals/1` },
          () => { findDOMNode(this).onload = function() { this.contentWindow.focus() } })
      } catch (error) {
        reportError('Error launching terminal', error)
      }
    }
  }

  async refreshCookie(clusterName) {
    const { namespace, ajax: { Jupyter } } = this.props

    this.scheduledRefresh = setTimeout(() => this.refreshCookie(clusterName), 1000 * 60 * 20)

    return Jupyter.notebooks(namespace, clusterName).setCookie()
  }

  componentDidMount() {
    this.loadIframe()
  }

  componentDidUpdate() {
    this.loadIframe()
  }

  componentWillUnmount() {
    if (this.scheduledRefresh) {
      clearTimeout(this.scheduledRefresh)
    }
  }

  render() {
    const { clusters } = this.props
    const { url } = this.state

    return clusters && url ?
      iframe({
        src: url,
        style: {
          border: 'none', flex: 1, marginBottom: '-1.5rem',
          marginTop: -45, clipPath: 'inset(45px 0 0)' // cuts off the useless Jupyter top bar
        }
      }) :
      centeredSpinner()
  }
}))


export const addNavPaths = () => {
  Nav.defPath('workspace-terminal-launch', {
    path: '/workspaces/:namespace/:name/notebooks/terminal',
    component: TerminalLauncher,
    title: ({ name }) => `${name} - Terminal`
  })
}
