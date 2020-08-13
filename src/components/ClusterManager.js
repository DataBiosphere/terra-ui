import { isToday } from 'date-fns'
import { isAfter } from 'date-fns/fp'
import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Fragment, PureComponent, useState } from 'react'
import { div, h, img, p, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, Clickable, IdContainer, Link, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { NewClusterModal } from 'src/components/NewClusterModal'
import { dataSyncingDocUrl } from 'src/data/machines'
import rLogo from 'src/images/r-logo.svg'
import { Ajax } from 'src/libs/ajax'
import { getDynamic, setDynamic } from 'src/libs/browser-storage'
import { clusterCost, collapsedClusterStatus, currentCluster, deleteText, trimClustersOldestFirst } from 'src/libs/cluster-utils'
import colors from 'src/libs/colors'
import { reportError, withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { clearNotification, notify } from 'src/libs/notifications'
import { errorNotifiedClusters } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


const noCompute = 'You do not have access to run analyses on this workspace.'

const styles = {
  verticalCenter: { display: 'flex', alignItems: 'center' },
  container: {
    height: '3rem',
    display: 'flex', alignItems: 'center', flex: 'none',
    paddingLeft: '1rem', paddingRight: '1rem',
    borderTopLeftRadius: 5, borderBottomLeftRadius: 5,
    backgroundColor: colors.light()
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '1rem'
  },
  button: isDisabled => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: isDisabled ? 'not-allowed' : 'pointer'
  })
}

const ClusterIcon = ({ shape, onClick, disabled, style, ...props }) => {
  return h(Clickable, {
    style: { color: onClick && !disabled ? colors.accent() : colors.dark(0.7), ...styles.verticalCenter, ...style },
    onClick, disabled, ...props
  }, [icon(shape, { size: 20 })])
}

export const ClusterErrorModal = ({ cluster, onDismiss }) => {
  const [error, setError] = useState()
  const [userscriptError, setUserscriptError] = useState(false)
  const [loadingClusterDetails, setLoadingClusterDetails] = useState(false)

  const loadClusterError = _.flow(
    withErrorReporting('Error loading notebook runtime details'),
    Utils.withBusyState(setLoadingClusterDetails)
  )(async () => {
    const { errors: clusterErrors } = await Ajax().Clusters.cluster(cluster.googleProject, cluster.runtimeName).details()
    if (_.some(({ errorMessage }) => errorMessage.includes('Userscript failed'), clusterErrors)) {
      setError(
        await Ajax()
          .Buckets
          .getObjectPreview(cluster.asyncRuntimeFields.stagingBucket, `userscript_output.txt`, cluster.googleProject, true)
          .then(res => res.text()))
      setUserscriptError(true)
    } else {
      setError(clusterErrors[0].errorMessage)
    }
  })

  Utils.useOnMount(() => { loadClusterError() })

  return h(Modal, {
    title: `Notebook Runtime Creation Failed${userscriptError ? ' due to Userscript Error' : ''}`,
    showCancel: false,
    onDismiss
  }, [
    div({ style: { whiteSpace: 'pre-wrap', overflowWrap: 'break-word', overflowY: 'auto', maxHeight: 500, background: colors.light() } }, [error]),
    loadingClusterDetails && spinnerOverlay
  ])
}

export const DeleteClusterModal = ({ cluster: { googleProject, runtimeName }, onDismiss, onSuccess }) => {
  const [deleting, setDeleting] = useState()
  const deleteCluster = _.flow(
    Utils.withBusyState(setDeleting),
    withErrorReporting('Error deleting notebook runtime')
  )(async () => {
    await Ajax().Clusters.cluster(googleProject, runtimeName).delete()
    onSuccess()
  })
  return h(Modal, {
    title: 'Delete Notebook Runtime?',
    onDismiss,
    okButton: deleteCluster
  }, [
    h(deleteText),
    deleting && spinnerOverlay
  ])
}

const ClusterErrorNotification = ({ cluster }) => {
  const [modalOpen, setModalOpen] = useState(false)

  return h(Fragment, [
    h(Clickable, {
      onClick: () => setModalOpen(true),
      style: {
        marginTop: '1rem',
        textDecoration: 'underline',
        fontWeight: 'bold'
      }
    }, ['SEE LOG INFO']),
    modalOpen && h(ClusterErrorModal, {
      cluster,
      onDismiss: () => setModalOpen(false)
    })
  ])
}

export default class ClusterManager extends PureComponent {
  static propTypes = {
    namespace: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    clusters: PropTypes.array,
    persistentDisks: PropTypes.array,
    canCompute: PropTypes.bool.isRequired,
    refreshClusters: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)
    this.state = {
      createModalDrawerOpen: false,
      busy: false
    }
  }

  componentDidUpdate(prevProps) {
    const { namespace, name } = this.props
    const prevCluster = _.last(_.sortBy('auditInfo.createdDate', _.remove({ status: 'Deleting' }, prevProps.clusters))) || {}
    const cluster = this.getCurrentCluster() || {}
    const twoMonthsAgo = _.tap(d => d.setMonth(d.getMonth() - 2), new Date())
    const welderCutOff = new Date('2019-08-01')
    const createdDate = new Date(cluster.createdDate)
    const dateNotified = getDynamic(sessionStorage, `notifiedOutdatedCluster${cluster.id}`) || {}
    const rStudioLaunchLink = Nav.getLink('workspace-app-launch', { namespace, name, app: 'RStudio' })

    if (cluster.status === 'Error' && prevCluster.status !== 'Error' && !_.includes(cluster.id, errorNotifiedClusters.get())) {
      notify('error', 'Error Creating Notebook Runtime', {
        message: h(ClusterErrorNotification, { cluster })
      })
      errorNotifiedClusters.update(Utils.append(cluster.id))
    } else if (
      cluster.status === 'Running' && prevCluster.status && prevCluster.status !== 'Running' &&
      cluster.labels.tool === 'RStudio' && window.location.hash !== rStudioLaunchLink
    ) {
      const rStudioNotificationId = notify('info', 'Your runtime is ready.', {
        message: h(ButtonPrimary, {
          href: rStudioLaunchLink,
          onClick: () => clearNotification(rStudioNotificationId)
        }, 'Launch Runtime')
      })
    } else if (isAfter(createdDate, welderCutOff) && !isToday(dateNotified)) { // TODO: remove this notification some time after the data syncing release
      setDynamic(sessionStorage, `notifiedOutdatedCluster${cluster.id}`, Date.now())
      notify('warn', 'Please Update Your Runtime', {
        message: h(Fragment, [
          p(['Last year, we introduced important updates to Terra that are not compatible with the older notebook runtime associated with this workspace. You are no longer able to save new changes to notebooks using this older runtime.']),
          h(Link, { href: dataSyncingDocUrl, ...Utils.newTabLinkProps }, ['Read here for more details.'])
        ])
      })
    } else if (isAfter(createdDate, twoMonthsAgo) && !isToday(dateNotified)) {
      setDynamic(sessionStorage, `notifiedOutdatedCluster${cluster.id}`, Date.now())
      notify('warn', 'Outdated Notebook Runtime', {
        message: 'Your notebook runtime is over two months old. Please consider deleting and recreating your runtime in order to access the latest features and security updates.'
      })
    } else if (cluster.status === 'Running' && prevCluster.status === 'Updating') {
      notify('success', 'Number of workers has updated successfully.')
    }
  }

  getActiveClustersOldestFirst() {
    const { clusters } = this.props
    return trimClustersOldestFirst(clusters)
  }

  getCurrentCluster() {
    const { clusters } = this.props
    return currentCluster(clusters)
  }

  async executeAndRefresh(promise) {
    try {
      const { refreshClusters } = this.props
      this.setState({ busy: true })
      await promise
      await refreshClusters()
    } catch (error) {
      reportError('Notebook Runtime Error', error)
    } finally {
      this.setState({ busy: false })
    }
  }

  startCluster() {
    const { googleProject, runtimeName } = this.getCurrentCluster()
    this.executeAndRefresh(
      Ajax().Clusters.cluster(googleProject, runtimeName).start()
    )
  }

  stopCluster() {
    const { googleProject, runtimeName } = this.getCurrentCluster()
    this.executeAndRefresh(
      Ajax().Clusters.cluster(googleProject, runtimeName).stop()
    )
  }

  render() {
    const { namespace, name, clusters, canCompute, persistentDisks } = this.props
    const { busy, createModalDrawerOpen, errorModalOpen } = this.state
    if (!clusters) {
      return null
    }
    const currentCluster = this.getCurrentCluster()
    const currentStatus = collapsedClusterStatus(currentCluster)

    const renderIcon = () => {
      switch (currentStatus) {
        case 'Stopped':
          return h(ClusterIcon, {
            shape: 'play',
            onClick: () => this.startCluster(),
            disabled: busy || !canCompute,
            tooltip: canCompute ? 'Start notebook runtime' : noCompute,
            'aria-label': 'Start notebook runtime'
          })
        case 'Running':
          return h(ClusterIcon, {
            shape: 'pause',
            onClick: () => this.stopCluster(),
            disabled: busy || !canCompute,
            tooltip: canCompute ? 'Stop notebook runtime' : noCompute,
            'aria-label': 'Stop notebook runtime'
          })
        case 'Starting':
        case 'Stopping':
        case 'Updating':
        case 'Creating':
        case 'LeoReconfiguring':
          return h(ClusterIcon, {
            shape: 'sync',
            disabled: true,
            tooltip: 'Notebook runtime update in progress',
            'aria-label': 'Notebook runtime update in progress'
          })
        case 'Error':
          return h(ClusterIcon, {
            shape: 'warning-standard',
            style: { color: colors.danger(0.9) },
            onClick: () => this.setState({ errorModalOpen: true }),
            disabled: busy || !canCompute,
            tooltip: canCompute ? 'View error' : noCompute,
            'aria-label': 'View error'
          })
        default:
          return h(ClusterIcon, {
            shape: 'play',
            onClick: () => this.setState({ createModalDrawerOpen: true }),
            disabled: busy || !canCompute,
            tooltip: canCompute ? 'Create notebook runtime' : noCompute,
            'aria-label': 'Create notebook runtime'
          })
      }
    }
    const totalCost = _.sum(_.map(clusterCost, clusters))
    const activeClusters = this.getActiveClustersOldestFirst()
    const activeDisks = _.remove({ status: 'Deleting' }, persistentDisks)
    const { Creating: creating, Updating: updating, LeoReconfiguring: reconfiguring } = _.countBy(collapsedClusterStatus, activeClusters)
    const isDisabled = !canCompute || creating || busy || updating || reconfiguring

    const isRStudioImage = currentCluster?.labels.tool === 'RStudio'
    const appName = isRStudioImage ? 'RStudio' : 'terminal'
    const appLaunchLink = Nav.getLink('workspace-app-launch', { namespace, name, app: appName })

    return div({ style: styles.container }, [
      (activeClusters.length > 1 || activeDisks.length > 1) && h(Link, {
        style: { marginRight: '1rem' },
        href: Nav.getLink('clusters'),
        tooltip: 'Multiple runtimes and/or persistent disks found in this billing project. Click to select which to delete.'
      }, [icon('warning-standard', { size: 24, style: { color: colors.danger() } })]),
      h(Link, {
        href: appLaunchLink,
        onClick: window.location.hash === appLaunchLink && currentStatus === 'Stopped' ? () => this.startCluster() : undefined,
        tooltip: canCompute ? `Open ${appName}` : noCompute,
        'aria-label': `Open ${appName}`,
        disabled: !canCompute,
        style: { marginRight: '2rem', ...styles.verticalCenter },
        ...(isRStudioImage ? {} : Utils.newTabLinkProps)
      }, [isRStudioImage ? img({ src: rLogo, alt: '', style: { maxWidth: 24, maxHeight: 24 } }) : icon('terminal', { size: 24 })]),
      renderIcon(),
      h(IdContainer, [id => h(Fragment, [
        h(Clickable, {
          id,
          style: styles.button(isDisabled),
          tooltip: Utils.cond(
            [!canCompute, () => noCompute],
            [creating, () => 'Your environment is being created'],
            () => 'Update runtime'
          ),
          onClick: () => this.setState({ createModalDrawerOpen: true }),
          disabled: isDisabled
        }, [
          div({ style: { marginLeft: '0.5rem', paddingRight: '0.5rem', color: colors.dark() } }, [
            div({ style: { fontSize: 12, fontWeight: 'bold' } }, 'Notebook Runtime'),
            div({ style: { fontSize: 10 } }, [
              span({ style: { textTransform: 'uppercase', fontWeight: 500 } }, [currentStatus === 'LeoReconfiguring' ? 'Updating' : (currentStatus || 'None')]),
              currentStatus && ` (${Utils.formatUSD(totalCost)} hr)`
            ])
          ]),
          icon('cog', { size: 22, style: { color: isDisabled ? colors.dark(0.7) : colors.accent() } })
        ])
      ])]),
      h(NewClusterModal, {
        isOpen: createModalDrawerOpen,
        namespace,
        clusters,
        persistentDisks,
        onDismiss: () => this.setState({ createModalDrawerOpen: false }),
        onSuccess: promise => {
          this.setState({ createModalDrawerOpen: false })
          this.executeAndRefresh(promise)
        }
      }),
      errorModalOpen && h(ClusterErrorModal, {
        cluster: currentCluster,
        onDismiss: () => this.setState({ errorModalOpen: false })
      })
    ])
  }
}
