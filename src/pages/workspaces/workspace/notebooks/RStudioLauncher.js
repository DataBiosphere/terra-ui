import _ from 'lodash/fp'
import { Component } from 'react'
import { findDOMNode } from 'react-dom'
import { div, iframe } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { spinner } from 'src/components/icons'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Utils from 'src/libs/utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const RStudioLauncher = _.flow(
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: () => `RStudio`,
    activeTab: 'notebooks'
  }),
  ajaxCaller
)(class RStudioLauncher extends Component {
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
    const { refreshClusters, ajax: { Clusters } } = this.props
    await refreshClusters()

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
      reportError('Error launching RStudio', error)
    }
  }

  async componentDidUpdate() {
    const { cluster: { clusterUrl } = {} } = this.props
    const { url } = this.state

    if (clusterUrl && !url) {
      try {
        await this.refreshCookie()

        this.setState(
          { url: clusterUrl },
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
        style: { border: 'none', flex: 1 },
        title: 'RStudio iframe'
      })
    } else {
      return div({ style: { padding: '2rem' } }, [
        'Creating Stopping Starting Updating Deleting'.includes(clusterStatus) &&
        spinner({ style: { color: colors.primary(), marginRight: '0.5rem' } }),
        Utils.switchCase(clusterStatus,
          ['Creating', () => 'Creating RStudio runtime environment. You can navigate away and return in 3-5 minutes.'],
          ['Stopping', () => 'RStudio runtime environment is stopping, which takes ~4 minutes. You can restart it after it finishes.'],
          ['Starting', () => 'Starting RStudio runtime environment, this may take up to 2 minutes.'],
          ['Updating', () => 'Updating RStudio runtime environment. You can navigate away and return in 3-5 minutes.'],
          ['Deleting', () => 'Deleting RStudio runtime environment, you can create a new one after it finishes.'],
          ['Stopped', () => 'RStudio runtime environment is stopped. Start it to use RStudio.'],
          ['Deleted', () => 'No existing RStudio runtime environment, you can create a new one to use RStudio.'],
          ['Error', () => 'Error with the RStudio runtime environment, please try again.'],
          ['Unknown', () => 'Error with the RStudio runtime environment, please try again.'],
          [Utils.DEFAULT, () => 'Invalid RStudio runtime environment state, please try again.']
        )
      ])
    }
  }
})


export const navPaths = [
  {
    name: 'workspace-rstudio-launch',
    path: '/workspaces/:namespace/:name/notebooks/rstudio',
    component: RStudioLauncher,
    title: ({ name }) => `${name} - RStudio`
  }
]
