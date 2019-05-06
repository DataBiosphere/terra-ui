import _ from 'lodash/fp'
import { findDOMNode } from 'react-dom'
import { div, iframe } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { spinner } from 'src/components/icons'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const TerminalLauncher = _.flow(
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: () => `Terminal`,
    activeTab: 'notebooks'
  }),
  ajaxCaller
)(class TerminalLauncher extends Component {
  async refreshCookie() {
    const { namespace, cluster: { clusterName }, ajax: { Jupyter } } = this.props

    this.scheduledRefresh = setTimeout(() => this.refreshCookie(), 1000 * 60 * 20)

    return Jupyter.notebooks(namespace, clusterName).setCookie()
  }

  async startCluster() {
    const { namespace, refreshClusters, ajax: { Jupyter } } = this.props
    await refreshClusters()
    if (!this.props.cluster) {
      await Jupyter.cluster(namespace, Utils.generateClusterName()).create({
        machineConfig: Utils.normalizeMachineConfig({})
      })
    }

    while (true) {
      await refreshClusters()
      const cluster = this.props.cluster // Note: reading up-to-date prop
      const status = cluster && cluster.status

      if (status === 'Running') {
        return
      } else {
        await Utils.handleNonRunningCluster(cluster, Jupyter)
      }
    }
  }

  async componentDidMount() {
    const { cluster: { clusterUrl } = {} } = this.props

    try {
      await this.startCluster()
      await this.refreshCookie()

      this.setState({ url: `${clusterUrl}/terminals/1` },
        () => { findDOMNode(this).onload = function() { this.contentWindow.focus() } })
    } catch (error) {
      reportError('Error launching terminal', error)
    }
  }

  componentWillUnmount() {
    if (this.scheduledRefresh) {
      clearTimeout(this.scheduledRefresh)
    }
  }

  render() {
    const { cluster } = this.props
    const { url } = this.state
    const clusterStatus = cluster && cluster.status

    if (clusterStatus === 'Running' && url) {
      return iframe({
        src: url,
        style: {
          border: 'none', flex: 1,
          marginTop: -45, clipPath: 'inset(45px 0 0)' // cuts off the useless Jupyter top bar
        }
      })
    } else {
      return div({ style: { padding: '2rem' } }, [
        spinner({ style: { color: colors.green[0], marginRight: '0.5rem' } }),
        (clusterStatus === 'Creating' || !cluster) ?
          'Creating runtime environment. You can navigate away and return in 5-10 minutes.' :
          'Starting runtime environment, this may take up to 2 minutes.'
      ])
    }
  }
})


export const navPaths = [
  {
    name: 'workspace-terminal-launch',
    path: '/workspaces/:namespace/:name/notebooks/terminal',
    component: TerminalLauncher,
    title: ({ name }) => `${name} - Terminal`
  }
]
