import _ from 'lodash/fp'
import { findDOMNode } from 'react-dom'
import { iframe } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { centeredSpinner } from 'src/components/icons'
import { Jupyter } from 'src/libs/ajax'
import { getBasicProfile } from 'src/libs/auth'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { Component } from 'src/libs/wrapped-components'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const TerminalLauncher = wrapWorkspace({
  breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
  title: () => `Terminal`,
  activeTab: 'notebooks'
},
class TerminalLauncherContent extends Component {
  async componentDidMount() {
    const { namespace } = this.props
    try {
      const { clusterName, clusterUrl } = _.flow(
        _.filter({ googleProject: namespace, creator: getBasicProfile().getEmail() }),
        _.remove({ status: 'Deleting' }),
        _.sortBy('createdDate'),
        _.last
      )(await Jupyter.clustersList())
      await this.refreshCookie(clusterName)
      this.setState({ url: `${clusterUrl}/terminals/1` },
        () => { findDOMNode(this).onload = function() { this.contentWindow.focus() } })
    } catch (error) {
      reportError('Error launching terminal', error)
      this.setState({ failed: true })
    }
  }

  async refreshCookie(clusterName) {
    const { namespace } = this.props

    this.scheduledRefresh = setTimeout(() => this.refreshCookie(clusterName), 1000 * 60 * 20)

    return Jupyter.notebooks(namespace, clusterName).setCookie()
  }

  componentWillUnmount() {
    if (this.scheduledRefresh) {
      clearTimeout(this.scheduledRefresh)
    }
  }

  render() {
    const { url } = this.state

    return url ?
      iframe({
        src: url,
        style: {
          border: 'none', flex: 1, marginBottom: '-1.5rem',
          marginTop: -45, clipPath: 'inset(45px 0 0)' // cuts off the useless Jupyter top bar
        }
      }) :
      centeredSpinner()
  }
})


export const addNavPaths = () => {
  Nav.defPath('workspace-terminal-launch', {
    path: '/workspaces/:namespace/:name/notebooks/terminal',
    component: TerminalLauncher,
    title: ({ name }) => `${name} - Terminal`
  })
}
