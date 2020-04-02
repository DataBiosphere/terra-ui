import { isToday } from 'date-fns'
import { isAfter } from 'date-fns/fp'
import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Fragment, PureComponent, useState } from 'react'
import { div, h, img, p, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, Clickable, IdContainer, Link, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { NewRuntimeModal } from 'src/components/NewRuntimeModal'
import { dataSyncingDocUrl } from 'src/data/machines'
import rLogo from 'src/images/r-logo.svg'
import { Ajax } from 'src/libs/ajax'
import { getDynamic, setDynamic } from 'src/libs/browser-storage'
import colors from 'src/libs/colors'
import { reportError, withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { clearNotification, notify } from 'src/libs/notifications'
import { currentRuntime, deleteText, normalizeRuntimeConfig, runtimeCost, trimRuntimesOldestFirst } from 'src/libs/runtime-utils'
import { errorNotifiedRuntimes } from 'src/libs/state'
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

const RuntimeIcon = ({ shape, onClick, disabled, style, ...props }) => {
  return h(Clickable, {
    style: { color: onClick && !disabled ? colors.accent() : colors.dark(0.7), ...styles.verticalCenter, ...style },
    onClick, disabled, ...props
  }, [icon(shape, { size: 20 })])
}

export const RuntimeErrorModal = ({ runtime, onDismiss }) => {
  const [error, setError] = useState()
  const [userscriptError, setUserscriptError] = useState(false)
  const [loadingRuntimeDetails, setLoadingRuntimeDetails] = useState(false)

  const loadRuntimeError = _.flow(
    withErrorReporting('Error loading notebook runtime details'),
    Utils.withBusyState(setLoadingRuntimeDetails)
  )(async () => {
    const { errors: runtimeErrors } = await Ajax().Runtimes.runtime(runtime.googleProject, runtime.runtimeName).details()
    if (_.some(({ errorMessage }) => errorMessage.includes('Userscript failed'), runtimeErrors)) {
      setError(
        await Ajax().Buckets.getObjectPreview(runtime.stagingBucket, `userscript_output.txt`, runtime.googleProject, true).then(res => res.text()))
      setUserscriptError(true)
    } else {
      setError(runtimeErrors[0].errorMessage)
    }
  })

  Utils.useOnMount(() => { loadRuntimeError() })

  return h(Modal, {
    title: `Notebook Runtime Creation Failed${userscriptError ? ' due to Userscript Error' : ''}`,
    showCancel: false,
    onDismiss
  }, [
    div({ style: { whiteSpace: 'pre-wrap', overflowWrap: 'break-word', overflowY: 'auto', maxHeight: 500, background: colors.light() } }, [error]),
    loadingRuntimeDetails && spinnerOverlay
  ])
}

export const DeleteRuntimeModal = ({ runtime: { googleProject, runtimeName }, onDismiss, onSuccess }) => {
  const [deleting, setDeleting] = useState()
  const deleteRuntime = _.flow(
    Utils.withBusyState(setDeleting),
    withErrorReporting('Error deleting notebook runtime')
  )(async () => {
    await Ajax().Runtimes.runtime(googleProject, runtimeName).delete()
    onSuccess()
  })
  return h(Modal, {
    title: 'Delete Notebook Runtime?',
    onDismiss,
    okButton: deleteRuntime
  }, [
    h(deleteText),
    deleting && spinnerOverlay
  ])
}

const RuntimeErrorNotification = ({ runtime }) => {
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
    modalOpen && h(RuntimeErrorModal, {
      runtime,
      onDismiss: () => setModalOpen(false)
    })
  ])
}

export default class RuntimeManager extends PureComponent {
  static propTypes = {
    namespace: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    runtimes: PropTypes.array,
    canCompute: PropTypes.bool.isRequired,
    refreshRuntimes: PropTypes.func.isRequired
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
    const prevRuntime = _.last(_.sortBy('createdDate', _.remove({ status: 'Deleting' }, prevProps.runtimes))) || {}
    const runtime = this.getCurrentRuntime() || {}
    const twoMonthsAgo = _.tap(d => d.setMonth(d.getMonth() - 2), new Date())
    const welderCutOff = new Date('2019-08-01')
    const createdDate = new Date(runtime.createdDate)
    const dateNotified = getDynamic(sessionStorage, `notifiedOutdatedRuntime${runtime.id}`) || {}
    const rStudioLaunchLink = Nav.getLink('workspace-app-launch', { namespace, name, app: 'RStudio' })

    if (runtime.status === 'Error' && prevRuntime.status !== 'Error' && !_.includes(runtime.id, errorNotifiedRuntimes.get())) {
      notify('error', 'Error Creating Notebook Runtime', {
        message: h(RuntimeErrorNotification, { runtime })
      })
      errorNotifiedRuntimes.update(Utils.append(runtime.id))
    } else if (
      runtime.status === 'Running' && prevRuntime.status && prevRuntime.status !== 'Running' &&
      runtime.labels.tool === 'RStudio' && window.location.hash !== rStudioLaunchLink
    ) {
      const rStudioNotificationId = notify('info', 'Your runtime is ready.', {
        message: h(ButtonPrimary, {
          href: rStudioLaunchLink,
          onClick: () => clearNotification(rStudioNotificationId)
        }, 'Launch Runtime')
      })
    } else if (isAfter(createdDate, welderCutOff) && !isToday(dateNotified)) { // TODO: remove this notification some time after the data syncing release
      setDynamic(sessionStorage, `notifiedOutdatedRuntime${runtime.id}`, Date.now())
      notify('warn', 'Please Update Your Runtime', {
        message: h(Fragment, [
          p(['Last year, we introduced important updates to Terra that are not compatible with the older notebook runtime associated with this workspace. You are no longer able to save new changes to notebooks using this older runtime.']),
          h(Link, { href: dataSyncingDocUrl, ...Utils.newTabLinkProps }, ['Read here for more details.'])
        ])
      })
    } else if (isAfter(createdDate, twoMonthsAgo) && !isToday(dateNotified)) {
      setDynamic(sessionStorage, `notifiedOutdatedRuntime${runtime.id}`, Date.now())
      notify('warn', 'Outdated Notebook Runtime', {
        message: 'Your notebook runtime is over two months old. Please consider deleting and recreating your runtime in order to access the latest features and security updates.'
      })
    } else if (runtime.status === 'Running' && prevRuntime.status === 'Updating') {
      notify('success', 'Number of workers has updated successfully.')
    }
  }

  getActiveRuntimesOldestFirst() {
    const { runtimes } = this.props
    return trimRuntimesOldestFirst(runtimes)
  }

  getCurrentRuntime() {
    const { runtimes } = this.props
    return currentRuntime(runtimes)
  }

  async executeAndRefresh(promise, waitBeforeRefreshMillis = 0) {
    try {
      const { refreshRuntimes } = this.props
      this.setState({ busy: true })
      await promise
      waitBeforeRefreshMillis && await Utils.delay(waitBeforeRefreshMillis)
      await refreshRuntimes()
    } catch (error) {
      reportError('Notebook Runtime Error', error)
    } finally {
      this.setState({ busy: false })
    }
  }

  createDefaultRuntime() {
    const { namespace } = this.props
    this.executeAndRefresh(
      Ajax().Runtimes.runtime(namespace, Utils.generateRuntimeName()).create({
        machineConfig: normalizeRuntimeConfig({})
      })
    )
  }

  startRuntime() {
    const { googleProject, runtimeName } = this.getCurrentRuntime()
    this.executeAndRefresh(
      Ajax().Runtimes.runtime(googleProject, runtimeName).start()
    )
  }

  stopRuntime() {
    const { googleProject, runtimeName } = this.getCurrentRuntime()
    this.executeAndRefresh(
      Ajax().Runtimes.runtime(googleProject, runtimeName).stop()
    )
  }

  render() {
    const { namespace, name, runtimes, canCompute } = this.props
    const { busy, createModalDrawerOpen, errorModalOpen } = this.state
    if (!runtimes) {
      return null
    }
    const currentRuntime = this.getCurrentRuntime()
    const currentStatus = currentRuntime?.status

    const renderIcon = () => {
      switch (currentStatus) {
        case 'Stopped':
          return h(RuntimeIcon, {
            shape: 'play',
            onClick: () => this.startRuntime(),
            disabled: busy || !canCompute,
            tooltip: canCompute ? 'Start notebook runtime' : noCompute,
            'aria-label': 'Start notebook runtime'
          })
        case 'Running':
          return h(RuntimeIcon, {
            shape: 'pause',
            onClick: () => this.stopRuntime(),
            disabled: busy || !canCompute,
            tooltip: canCompute ? 'Stop notebook runtime' : noCompute,
            'aria-label': 'Stop notebook runtime'
          })
        case 'Starting':
        case 'Stopping':
        case 'Updating':
        case 'Creating':
          return h(RuntimeIcon, {
            shape: 'sync',
            disabled: true,
            tooltip: 'Notebook runtime update in progress',
            'aria-label': 'Notebook runtime update in progress'
          })
        case 'Error':
          return h(RuntimeIcon, {
            shape: 'warning-standard',
            style: { color: colors.danger(0.9) },
            onClick: () => this.setState({ errorModalOpen: true }),
            disabled: busy || !canCompute,
            tooltip: canCompute ? 'View error' : noCompute,
            'aria-label': 'View error'
          })
        default:
          return h(RuntimeIcon, {
            shape: 'play',
            onClick: () => this.createDefaultRuntime(),
            disabled: busy || !canCompute,
            tooltip: canCompute ? 'Create notebook runtime' : noCompute,
            'aria-label': 'Create notebook runtime'
          })
      }
    }
    const totalCost = _.sum(_.map(runtimeCost, runtimes))
    const activeRuntimes = this.getActiveRuntimesOldestFirst()
    const { Creating: creating, Updating: updating } = _.countBy('status', activeRuntimes)
    const isDisabled = !canCompute || creating || busy || updating

    const isRStudioImage = currentRuntime?.labels.tool === 'RStudio'
    const appName = isRStudioImage ? 'RStudio' : 'terminal'
    const appLaunchLink = Nav.getLink('workspace-app-launch', { namespace, name, app: appName })

    return div({ style: styles.container }, [
      activeRuntimes.length > 1 && h(Link, {
        style: { marginRight: '1rem' },
        href: Nav.getLink('runtimes'),
        tooltip: 'Multiple runtimes found in this billing project. Click to select which to delete.'
      }, [icon('warning-standard', { size: 24, style: { color: colors.danger() } })]),
      h(Link, {
        href: appLaunchLink,
        onClick: window.location.hash === appLaunchLink && currentStatus === 'Stopped' ? () => this.startRuntime() : undefined,
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
            () => 'Update runtime'
          ),
          onClick: () => this.setState({ createModalDrawerOpen: true }),
          disabled: isDisabled
        }, [
          div({ style: { marginLeft: '0.5rem', paddingRight: '0.5rem', color: colors.dark() } }, [
            div({ style: { fontSize: 12, fontWeight: 'bold' } }, 'Notebook Runtime'),
            div({ style: { fontSize: 10 } }, [
              span({ style: { textTransform: 'uppercase', fontWeight: 500 } }, currentStatus || 'None'),
              currentStatus && ` (${Utils.formatUSD(totalCost)} hr)`
            ])
          ]),
          icon('cog', { size: 22, style: { color: isDisabled ? colors.dark(0.7) : colors.accent() } })
        ])
      ])]),
      h(NewRuntimeModal, {
        isOpen: createModalDrawerOpen,
        namespace,
        currentRuntime,
        onDismiss: () => this.setState({ createModalDrawerOpen: false }),
        onSuccess: (promise, waitBeforeRefreshMillis = 0) => {
          this.setState({ createModalDrawerOpen: false })
          this.executeAndRefresh(promise, waitBeforeRefreshMillis)
        }
      }),
      errorModalOpen && h(RuntimeErrorModal, {
        runtime: currentRuntime,
        onDismiss: () => this.setState({ errorModalOpen: false })
      })
    ])
  }
}
