import _ from 'lodash/fp'
import { createRef, Fragment } from 'react'
import { div, h, iframe } from 'react-hyperscript-helpers'
import { withState } from 'recompose'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { linkButton, spinnerOverlay, link } from 'src/components/common'
import { icon, spinner } from 'src/components/icons'
import { pushNotification } from 'src/components/Notifications'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import ExportNotebookModal from 'src/pages/workspaces/workspace/notebooks/ExportNotebookModal'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const styles = {
  pageContainer: {
    padding: '2rem'
  },
  step: {
    container: {
      display: 'flex',
      alignItems: 'center',
      lineHeight: '2rem',
      margin: '0.5rem 0'
    },
    col1: {
      flex: '0 0 30px'
    },
    col2: {
      flex: 1
    }
  },
  creatingMessage: {
    paddingLeft: '4rem'
  }
}

const getCluster = clusters => {
  return _.flow(
    _.remove({ status: 'Deleting' }),
    _.sortBy('createdDate'),
    _.first
  )(clusters)
}

const NotebookLauncher = _.flow(
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: ({ notebookName }) => `Notebooks - ${notebookName}`,
    topBarContent: ({ workspace, notebookName }) => {
      return workspace && !(Utils.canWrite(workspace.accessLevel) && workspace.canCompute)
        && h(ReadOnlyMessage, { notebookName, workspace })
    },
    showTabBar: false
  }),
  ajaxCaller
)(({ workspace, ...props }) => {
  return Utils.canWrite(workspace.accessLevel) && workspace.canCompute ?
    h(NotebookEditor, { workspace, ...props }) :
    h(NotebookViewer, { workspace, ...props })
})

class ReadOnlyMessage extends Component {
  constructor(props) {
    super(props)
    this.state = {
      copying: false
    }
  }

  render() {
    const { notebookName, workspace } = this.props
    const { copying } = this.state
    return div({ style: { marginLeft: 'auto' } }, [
      div({ style: { fontSize: 16, fontWeight: 'bold' } },
        ['Viewing in read-only mode.']),
      div({ style: { fontSize: 14 } }, [
        'To edit this notebook, ',
        link({ onClick: () => this.setState({ copying: true }) }, 'copy'),
        ' it to another workspace'
      ]),
      copying && h(ExportNotebookModal, {
        printName: notebookName.slice(0, -6), workspace, fromLauncher: true,
        onDismiss: () => this.setState({ copying: false })
      })
    ])
  }
}

class NotebookViewer extends Component {
  constructor(props) {
    super(props)
    this.state = {
      preview: undefined,
      busy: false
    }
  }

  async componentDidMount() {
    try {
      const { namespace, notebookName, workspace: { workspace: { bucketName } }, ajax: { Buckets } } = this.props
      this.setState({ busy: true })
      const preview = await Buckets.notebook(namespace, bucketName, notebookName).preview()
      this.setState({ preview })
    } catch (error) {
      reportError('Error loading notebook', error)
    } finally {
      this.setState({ busy: false })
    }
  }

  render() {
    const { namespace, name } = this.props
    const { preview, busy } = this.state
    return h(Fragment, [
      preview && iframe({
        style: { border: 'none', flex: 1 },
        srcDoc: preview
      }),
      preview && linkButton({
        style: { position: 'absolute', top: 20, left: 'calc(50% + 570px)' },
        onClick: () => Nav.goToPath('workspace-notebooks', { namespace, name })
      }, [icon('times-circle', { size: 30 })]),
      busy && spinnerOverlay
    ])
  }
}

class NotebookInUseMessage extends Component {
  render() {
    return div({ style: { backgroundColor: colors.orange[0], color: 'white', padding: '1rem', borderRadius: '0.5rem' } }, [
      div({ style: { fontSize: 16, fontWeight: 'bold' } },
        ['This notebook has been edited recently, so it may be in use.']),
      div({ style: { fontSize: 14 } }, [
        'If you edit the notebook at the same time as someone else, your changes may be lost. If you made the recent changes yourself, you may disregard this message.'
      ])
    ])
  }
}

class NotebookEditor extends Component {
  saveNotebook() {
    this.notebookFrame.current.contentWindow.postMessage('save', '*')
  }

  constructor(props) {
    super(props)
    this.state = { localizeFailures: 0 }
    this.isSaved = Utils.atom(true)
    this.notebookFrame = createRef()
    this.beforeUnload = e => {
      if (!this.isSaved.get()) {
        this.saveNotebook()
        e.preventDefault()
      }
    }
    this.handleMessages = e => {
      const { namespace, name } = this.props

      switch (e.data) {
        case 'close':
          Nav.goToPath('workspace-notebooks', { namespace, name })
          break
        case 'saved':
          this.isSaved.set(true)
          break
        case 'dirty':
          this.isSaved.set(false)
          break
        default:
          console.log('Unrecognized message:', e.data)
      }
    }
  }

  async componentDidMount() {
    this.mounted = true

    window.addEventListener('message', this.handleMessages)
    window.addEventListener('beforeunload', this.beforeUnload)

    try {
      const { clusterName, clusterUrl, error } = await this.startCluster()

      if (error) {
        this.setState({ clusterError: error, failed: true })
        return
      }

      const { namespace, ajax: { Jupyter } } = this.props
      await Promise.all([
        this.localizeNotebook(clusterName),
        Jupyter.notebooks(namespace, clusterName).setCookie()
      ])

      const { workspace: { workspace: { bucketName } }, notebookName, ajax: { Buckets } } = this.props
      const { updated } = await Buckets.notebook(namespace, bucketName, notebookName.slice(0, -6)).getObject()
      const tenMinutesAgo = _.tap(d => d.setMinutes(d.getMinutes() - 10), new Date())
      const isRecent = new Date(updated) > tenMinutesAgo
      if (isRecent) {
        pushNotification({
          type: 'warning',
          dismissable: { click: true },
          dismiss: { duration: 0 },
          content: h(NotebookInUseMessage),
          width: 375
        })
      }

      Nav.blockNav.set(() => new Promise(resolve => {
        if (this.isSaved.get()) {
          resolve()
        } else {
          this.saveNotebook()
          this.setState({ saving: true })
          this.isSaved.subscribe(resolve)
        }
      }))

      const { name: workspaceName } = this.props
      this.setState({ url: `${clusterUrl}/notebooks/${workspaceName}/${notebookName}` })
    } catch (error) {
      if (this.mounted) {
        reportError('Notebook cannot be launched', error)
        this.setState({ failed: true })
      }
    }
  }

  componentWillUnmount() {
    this.mounted = false
    if (this.scheduledRefresh) {
      clearTimeout(this.scheduledRefresh)
    }

    window.removeEventListener('message', this.handleMessages)
    window.removeEventListener('beforeunload', this.beforeUnload)
    Nav.blockNav.reset()
  }

  componentDidUpdate(prevProps, prevState) {
    const oldClusters = prevProps.clusters
    const { clusters } = this.props
    const prevCluster = getCluster(oldClusters)
    const currCluster = getCluster(clusters)
    if (prevCluster && prevCluster.id !== currCluster.id) {
      document.location.reload()
    }
  }


  async startCluster() {
    const { refreshClusters, ajax: { Jupyter } } = this.props

    while (this.mounted) {
      await refreshClusters()
      const { clusters } = this.props //Note: placed here to read updated value after refresh
      const cluster = getCluster(clusters)
      if (!cluster) {
        return { error: 'You do not have access to run analyses on this workspace.' }
      }

      const { status, googleProject, clusterName } = cluster
      this.setState({ clusterStatus: status })

      if (status === 'Running') {
        return cluster
      } else if (status === 'Stopped') {
        await Jupyter.cluster(googleProject, clusterName).start()
        refreshClusters()
        await Utils.delay(10000)
      } else {
        await Utils.delay(3000)
      }
    }
  }

  async localizeNotebook(clusterName) {
    const { namespace, name: workspaceName, notebookName, workspace: { workspace: { bucketName } }, ajax: { Jupyter } } = this.props

    while (this.mounted) {
      try {
        await Promise.all([
          Jupyter.notebooks(namespace, clusterName).localize({
            [`~/${workspaceName}/.delocalize.json`]: `data:application/json,{"destination":"gs://${bucketName}/notebooks","pattern":""}`
          }),
          Jupyter.notebooks(namespace, clusterName).localize({
            [`~/${workspaceName}/${notebookName}`]: `gs://${bucketName}/notebooks/${notebookName}`
          })
        ])
        return
      } catch (e) {
        const { localizeFailures } = this.state

        if (localizeFailures < 5) {
          this.setState({ localizeFailures: localizeFailures + 1 })
          await Utils.delay(5000)
        } else {
          throw new Error('Unable to copy notebook to cluster, was it renamed or deleted in the Workspace Bucket?')
        }
      }
    }
  }

  render() {
    const { clusterStatus, clusterError, localizeFailures, failed, url, saving } = this.state

    if (url) {
      return h(Fragment, [
        iframe({
          src: url,
          style: { border: 'none', flex: 1 },
          ref: this.notebookFrame
        }),
        saving && spinnerOverlay
      ])
    }

    const isCreating = clusterStatus === 'Creating'
    const currentStep = clusterStatus !== 'Running' ? 1 : 2

    const step = (index, text) => div({ style: styles.step.container }, [
      div({ style: styles.step.col1 }, [
        index < currentStep && icon('check', { size: 24, style: { color: colors.green[0] } }),
        index === currentStep && (failed ? icon('times', { size: 24, style: { color: colors.red[0] } }) : spinner())
      ]),
      div({ style: styles.step.col2 }, [text])
    ])

    return h(Fragment, [
      div({ style: styles.pageContainer }, [
        div({ style: Style.elements.sectionHeader }, ['Terra is preparing your notebook']),
        step(1,
          Utils.cond(
            [clusterError, clusterError],
            [isCreating, 'Creating notebook runtime'],
            'Waiting for notebook runtime to be ready'
          )
        ),
        isCreating && div({ style: styles.creatingMessage }, [
          icon('info', { size: 24, style: { color: colors.orange[0] } }),
          'This can take several minutes. You may navigate away and come back once the cluster is ready.'
        ]),
        step(2, localizeFailures ?
          `Error loading notebook, retry number ${localizeFailures}...` :
          'Loading notebook')
      ])
    ])
  }
}


export const addNavPaths = () => {
  Nav.defPath('workspace-notebook-launch', {
    path: '/workspaces/:namespace/:name/notebooks/launch/:notebookName',
    component: NotebookLauncher,
    title: ({ name, notebookName }) => `${name} - Notebooks - ${notebookName}`
  })
}
