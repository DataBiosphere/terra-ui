import { isToday } from 'date-fns'
import { isAfter } from 'date-fns/fp'
import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Fragment, PureComponent, useState } from 'react'
import { div, h, img, p, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, ButtonSecondary, Clickable, IdContainer, Link, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { NewClusterModal } from 'src/components/NewClusterModal'
import { notify } from 'src/components/Notifications.js'
import { Popup } from 'src/components/PopupTrigger'
import { dataSyncingDocUrl } from 'src/data/clusters'
import rLogo from 'src/images/r-logo.svg'
import { Ajax } from 'src/libs/ajax'
import { getDynamic, setDynamic } from 'src/libs/browser-storage'
import { clusterCost, currentCluster, deleteText, normalizeMachineConfig, trimClustersOldestFirst } from 'src/libs/cluster-utils'
import colors from 'src/libs/colors'
import { reportError, withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { errorNotifiedClusters } from 'src/libs/state.js'
import * as Utils from 'src/libs/utils'


const noCompute = 'You do not have access to run analyses on this workspace.'

const styles = {
  verticalCenter: { display: 'flex', alignItems: 'center' },
  container: {
    height: '3rem',
    display: 'flex', alignItems: 'center', flex: 'none',
    marginLeft: 'auto', paddingLeft: '1rem', paddingRight: '1rem',
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
    withErrorReporting('Error loading application compute instance details'),
    Utils.withBusyState(setLoadingClusterDetails)
  )(async () => {
    const { errors: clusterErrors } = await Ajax().Clusters.cluster(cluster.googleProject, cluster.clusterName).details()
    if (_.some(({ errorMessage }) => errorMessage.includes('Userscript failed'), clusterErrors)) {
      setError(
        await Ajax().Buckets.getObjectPreview(cluster.stagingBucket, `userscript_output.txt`, cluster.googleProject, true).then(res => res.text()))
      setUserscriptError(true)
    } else {
      setError(clusterErrors[0].errorMessage)
    }
  })

  Utils.useOnMount(() => { loadClusterError() })

  return h(Modal, {
    title: `Application Compute Instance Creation Failed${userscriptError ? ' due to Userscript Error' : ''}`,
    showCancel: false,
    onDismiss
  }, [
    div({ style: { whiteSpace: 'pre-wrap', overflowWrap: 'break-word', overflowY: 'auto', maxHeight: 500, background: colors.light() } }, [error]),
    loadingClusterDetails && spinnerOverlay
  ])
}

export const DeleteClusterModal = ({ cluster: { googleProject, clusterName }, onDismiss, onSuccess }) => {
  const [deleting, setDeleting] = useState()
  const deleteCluster = _.flow(
    Utils.withBusyState(setDeleting),
    withErrorReporting('Error deleting application compute instance')
  )(async () => {
    await Ajax().Clusters.cluster(googleProject, clusterName).delete()
    onSuccess()
  })
  return h(Modal, {
    title: 'Delete application compute instance?',
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
    const prevCluster = _.last(_.sortBy('createdDate', _.remove({ status: 'Deleting' }, prevProps.clusters))) || {}
    const cluster = this.getCurrentCluster() || {}
    const twoMonthsAgo = _.tap(d => d.setMonth(d.getMonth() - 2), new Date())
    const welderCutOff = new Date('2019-08-01')
    const createdDate = new Date(cluster.createdDate)
    const dateNotified = getDynamic(sessionStorage, `notifiedOutdatedCluster${cluster.id}`) || {}

    if (cluster.status === 'Error' && prevCluster.status !== 'Error' && !_.includes(cluster.id, errorNotifiedClusters.get())) {
      notify('error', 'Error Creating Application Compute Instance', {
        message: h(ClusterErrorNotification, { cluster })
      })
      errorNotifiedClusters.update(Utils.append(cluster.id))
    } else if (isAfter(createdDate, welderCutOff) && !isToday(dateNotified)) { // TODO: remove this notification some time after the data syncing release
      setDynamic(sessionStorage, `notifiedOutdatedCluster${cluster.id}`, Date.now())
      notify('warn', 'Please Update Your Runtime', {
        message: h(Fragment, [
          p(['On Sunday Oct 20th at 10am, we are introducing important updates to Terra, which are not compatible with the older application compute instance in this workspace. After this date, you will no longer be able to save new changes to notebooks in one of these older runtimes.']),
          h(Link, {
            variant: 'light',
            href: dataSyncingDocUrl,
            ...Utils.newTabLinkProps
          }, ['Read here for more details.'])
        ])
      })
    } else if (isAfter(createdDate, twoMonthsAgo) && !isToday(dateNotified)) {
      setDynamic(sessionStorage, `notifiedOutdatedCluster${cluster.id}`, Date.now())
      notify('warn', 'Outdated Application Compute Instance', {
        message: 'Your application compute instance is over two months old. Please consider deleting and recreating your runtime in order to access the latest features and security updates.'
      })
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
      reportError('Application compute instance Error', error)
    } finally {
      this.setState({ busy: false })
    }
  }

  createDefaultCluster() {
    const { namespace } = this.props
    this.executeAndRefresh(
      Ajax().Clusters.cluster(namespace, Utils.generateClusterName()).create({
        machineConfig: normalizeMachineConfig({})
      })
    )
  }

  destroyClusters(keepIndex) {
    const activeClusters = this.getActiveClustersOldestFirst()
    this.executeAndRefresh(
      Promise.all(_.map(
        ({ googleProject, clusterName }) => Ajax().Clusters.cluster(googleProject, clusterName).delete(),
        _.without([_.nth(keepIndex, activeClusters)], activeClusters)
      ))
    )
  }

  startCluster() {
    const { googleProject, clusterName } = this.getCurrentCluster()
    this.executeAndRefresh(
      Ajax().Clusters.cluster(googleProject, clusterName).start()
    )
  }

  stopCluster() {
    const { googleProject, clusterName } = this.getCurrentCluster()
    this.executeAndRefresh(
      Ajax().Clusters.cluster(googleProject, clusterName).stop()
    )
  }

  renderDestroyForm() {
    const { busy } = this.state
    return div({ style: { padding: '1rem', width: 300 } }, [
      div([
        'Your new runtime environment is ready to use.'
      ]),
      div({ style: styles.row }, [
        div({ style: { marginLeft: 'auto' } }, [
          busy && icon('loadingSpinner')
        ]),
        h(ButtonSecondary, {
          style: { marginLeft: '1rem', marginRight: '1rem' },
          disabled: busy,
          onClick: () => this.destroyClusters(-2)
        }, 'Discard'),
        h(ButtonPrimary, { disabled: busy, onClick: () => this.destroyClusters(-1) }, 'Apply')
      ])
    ])
  }

  render() {
    const { namespace, name, clusters, canCompute } = this.props
    const { busy, createModalDrawerOpen, errorModalOpen, pendingNav } = this.state
    if (!clusters) {
      return null
    }
    const currentCluster = this.getCurrentCluster()
    const currentStatus = currentCluster?.status

    const renderIcon = () => {
      switch (currentStatus) {
        case 'Stopped':
          return h(ClusterIcon, {
            shape: 'play',
            onClick: () => this.startCluster(),
            disabled: busy || !canCompute,
            tooltip: canCompute ? 'Start application compute instance' : noCompute,
            'aria-label': 'Start application compute instance'
          })
        case 'Running':
          return h(ClusterIcon, {
            shape: 'pause',
            onClick: () => this.stopCluster(),
            disabled: busy || !canCompute,
            tooltip: canCompute ? 'Stop application compute instance' : noCompute,
            'aria-label': 'Stop application compute instance'
          })
        case 'Starting':
        case 'Stopping':
        case 'Creating':
          return h(ClusterIcon, {
            shape: 'sync',
            disabled: true,
            tooltip: 'Application compute instance update in progress',
            'aria-label': 'Application compute instance update in progress'
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
            onClick: () => this.createDefaultCluster(),
            disabled: busy || !canCompute,
            tooltip: canCompute ? 'Create application compute instance' : noCompute,
            'aria-label': 'Create application compute instance'
          })
      }
    }
    const totalCost = _.sum(_.map(clusterCost, clusters))
    const activeClusters = this.getActiveClustersOldestFirst()
    const creating = _.some({ status: 'Creating' }, activeClusters)
    const multiple = !creating && activeClusters.length > 1 && currentStatus !== 'Error'
    const isDisabled = !canCompute || creating || multiple || busy

    const isRStudioImage = currentCluster?.labels.tool === 'RStudio'
    const appName = isRStudioImage ? 'RStudio' : 'terminal'

    return div({ style: styles.container }, [
      h(Link, {
        href: Nav.getLink('workspace-app-launch', { namespace, name, app: appName }),
        tooltip: canCompute ? `Open ${appName}` : noCompute,
        'aria-label': `Open ${appName}`,
        disabled: !canCompute,
        style: { marginRight: '2rem', ...styles.verticalCenter },
        ...(isRStudioImage ? {} : Utils.newTabLinkProps)
      }, [isRStudioImage ? img({ src: rLogo, style: { maxWidth: 24, maxHeight: 24 } }) : icon('terminal', { size: 24 })]),
      renderIcon(),
      h(IdContainer, [id => h(Fragment, [
        h(Clickable, {
          id,
          style: styles.button(isDisabled),
          tooltip: Utils.cond(
            [!canCompute, () => noCompute],
            [creating, () => 'Your environment is being created'],
            [multiple, () => undefined],
            () => 'Update runtime'
          ),
          onClick: () => this.setState({ createModalDrawerOpen: true }),
          disabled: isDisabled
        }, [
          div({ style: { marginLeft: '0.5rem', paddingRight: '0.5rem', color: colors.dark() } }, [
            div({ style: { fontSize: 12, fontWeight: 'bold' } }, 'Application Compute'),
            div({ style: { fontSize: 10 } }, [
              span({ style: { textTransform: 'uppercase', fontWeight: 500 } }, currentStatus || 'None'),
              currentStatus && ` (${Utils.formatUSD(totalCost)} hr)`
            ])
          ]),
          icon('cog', { size: 22, style: { color: isDisabled ? colors.dark(0.7) : colors.accent() } })
        ]),
        multiple && h(Popup, { side: 'bottom', target: id, handleClickOutside: _.noop }, [this.renderDestroyForm()])
      ])]),
      h(NewClusterModal, {
        isOpen: createModalDrawerOpen,
        namespace,
        currentCluster,
        onDismiss: () => this.setState({ createModalDrawerOpen: false }),
        onSuccess: promise => {
          this.setState({ createModalDrawerOpen: false })
          this.executeAndRefresh(promise)
        }
      }),
      errorModalOpen && h(ClusterErrorModal, {
        cluster: currentCluster,
        onDismiss: () => this.setState({ errorModalOpen: false })
      }),
      pendingNav && spinnerOverlay
    ])
  }
}
