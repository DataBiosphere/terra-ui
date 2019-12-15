import _ from 'lodash/fp'
import { Component } from 'react'
import { findDOMNode } from 'react-dom'
import { div, iframe } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { spinner } from 'src/components/icons'
import { ajaxCaller } from 'src/libs/ajax'
import { normalizeMachineConfig } from 'src/libs/cluster-utils'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Utils from 'src/libs/utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const TerminalLauncher = _.flow(
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: () => `Terminal`,
    activeTab: 'notebooks'
  }),
  ajaxCaller
)(class TerminalLauncher extends Component {
  constructor(props) {
    super(props)
    this.state = { url: undefined }
  }

  refreshCookie() {
    const { namespace, cluster: { clusterName }, ajax: { Clusters } } = this.props

    this.scheduledRefresh = setTimeout(() => this.refreshCookie(), 1000 * 60 * 20)

    return Clusters.notebooks(namespace, clusterName).setCookie()
  }

  async startCluster() {
    const { namespace, refreshClusters, ajax: { Clusters } } = this.props
    await refreshClusters()
    if (!this.props.cluster) {
      await Clusters.cluster(namespace, Utils.generateClusterName()).create({
        machineConfig: normalizeMachineConfig({})
      })
    }

    while (true) {
      await refreshClusters()
      const cluster = this.props.cluster // Note: reading up-to-date prop
      const status = cluster && cluster.status

      if (status === 'Running') {
        return
      } else {
        await Utils.handleNonRunningCluster(cluster, Clusters)
      }
    }
  }

  async componentDidMount() {
    try {
      await this.startCluster()
    } catch (error) {
      reportError('Error launching terminal', error)
    }
  }

  async componentDidUpdate() {
    const { cluster: { clusterUrl } = {} } = this.props
    const { url } = this.state

    if (clusterUrl && !url) {
      try {
        await this.refreshCookie()

        this.setState({ url: `${clusterUrl}/terminals/1` },
          () => { findDOMNode(this).onload = function() { this.contentWindow.focus() } })
      } catch (error) {
        reportError('Error launching terminal', error)
      }
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
        },
        title: 'Interactive terminal iframe'
      })
    } else {
      return div({ style: { padding: '2rem' } }, [
        'Creating Stopping Starting Updating Deleting'.includes(clusterStatus) &&
        spinner({ style: { color: colors.primary(), marginRight: '0.5rem' } }),
        Utils.switchCase(clusterStatus,
          ['Creating', () => 'Creating notebook runtime environment. You can navigate away and return in 3-5 minutes.'],
          ['Stopping', () => 'Notebook runtime environment is stopping, which takes ~4 minutes. You can restart it after it finishes.'],
          ['Starting', () => 'Starting notebook runtime environment, this may take up to 2 minutes.'],
          ['Updating', () => 'Updating notebook runtime environment. You can navigate away and return in 3-5 minutes.'],
          ['Deleting', () => 'Deleting notebook runtime environment, you can create a new one after it finishes.'],
          ['Stopped', () => 'Notebook runtime environment is stopped. Start it to edit your notebook or use the terminal.'],
          ['Deleted', () => 'No existing notebook runtime environment, you can create a new one to edit your notebook or use the terminal.'],
          ['Error', () => 'Error with the notebook runtime environment, please try again.'],
          ['Unknown', () => 'Error with the notebook runtime environment, please try again.'],
          [Utils.DEFAULT, () => 'Invalid notebook runtime environment state, please try again.']
        )
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
