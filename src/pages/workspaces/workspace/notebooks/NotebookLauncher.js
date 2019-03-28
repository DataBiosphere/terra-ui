import _ from 'lodash/fp'
import { createRef, Fragment, useState } from 'react'
import { div, h, iframe } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { NewClusterModal } from 'src/components/ClusterManager'
import { buttonOutline, linkButton, spinnerOverlay } from 'src/components/common'
import { icon, spinner } from 'src/components/icons'
import { notify } from 'src/components/Notifications'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import ExportNotebookModal from 'src/pages/workspaces/workspace/notebooks/ExportNotebookModal'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const getCluster = clusters => {
  return _.flow(
    _.remove({ status: 'Deleting' }),
    _.remove({ status: 'Error' }),
    _.sortBy('createdDate'),
    _.first
  )(clusters)
}

const NotebookLauncher = _.flow(
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: ({ notebookName }) => `Notebooks - ${notebookName}`,
    showTabBar: false
  }),
  ajaxCaller
)(pure(({ clusters, queryParams = {}, ...props }) => {
  const { workspace } = props
  return (Utils.canWrite(workspace.accessLevel) && workspace.canCompute && !queryParams['read-only']) ?
    h(NotebookEditor, { ...props, cluster: getCluster(clusters) }) :
    h(NotebookPreview, props)
}))

const ReadOnlyMessage = ({ notebookName, workspace, workspace: { canCompute, workspace: { namespace, name } } }) => {
  const [copying, setCopying] = useState(false)
  const notebookLink = Nav.getLink('workspace-notebook-launch', { namespace, name, notebookName })
  const notebookLabLink = Nav.getLink('workspace-notebook-launch', { namespace, app: 'lab', name, notebookName })

  return div({ style: { padding: '1rem 2rem', display: 'flex', alignItems: 'center' } }, [
    div({ style: { fontSize: 16, fontWeight: 'bold', position: 'absolute' } },
      ['Viewing read-only']),
    div({ style: { flexGrow: 1 } }),
    canCompute ?
      h(Fragment, [
        buttonOutline({
          as: 'a',
          href: notebookLink,
          style: { marginRight: '1rem' }
        }, ['edit in Jupyter']),
        buttonOutline({
          as: 'a',
          href: notebookLabLink
        }, ['edit in JupyterLab'])
      ]) :
      buttonOutline({
        onClick: () => setCopying(true)
      }, ['copy to another workspace to edit']),
    div({ style: { flexGrow: 1 } }),
    copying && h(ExportNotebookModal, {
      printName: notebookName.slice(0, -6), workspace, fromLauncher: true,
      onDismiss: () => setCopying(false)
    })
  ])
}

const NotebookPreview = pure(props => {
  const { namespace, name, notebookName, workspace } = props
  return h(Fragment, [
    h(ReadOnlyMessage, { notebookName, workspace }),
    h(NotebookPreviewFrame, {
      ...props,
      loadedChildren: div({ style: { position: 'relative' } }, [
        linkButton({
          style: { position: 'absolute', top: 20, left: 'calc(50% + 580px)' },
          href: Nav.getLink('workspace-notebooks', { namespace, name })
        }, [icon('times-circle', { size: 30 })])
      ])
    })
  ])
})

class NotebookPreviewFrame extends Component {
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
    const { loadedChildren } = this.props
    const { preview, busy } = this.state
    return h(Fragment, [
      preview && loadedChildren,
      preview && iframe({
        style: { border: 'none', flex: 1 },
        srcDoc: preview
      }),
      busy && div({ style: { margin: '0.5rem 2rem' } }, [
        spinner({ style: { marginRight: '0.5rem' } }), 'Generating preview...'
      ])
    ])
  }
}

const initialEditorState = {
  localizeFailures: 0,
  clusterError: undefined,
  failed: false,
  url: undefined,
  saving: false,
  createOpen: false,
  createRequested: false
}

class NotebookEditor extends Component {
  saveNotebook() {
    this.notebookFrame.current.contentWindow.postMessage('save', '*')
  }

  constructor(props) {
    super(props)
    this.state = initialEditorState
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
    const { refreshClusters } = this.props
    this.mounted = true

    window.addEventListener('message', this.handleMessages)
    window.addEventListener('beforeunload', this.beforeUnload)

    await refreshClusters()
    if (!!this.props.cluster) { // Note: reading up-to-date prop
      this.setUp()
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

  componentDidUpdate(prevProps) {
    const prevCluster = prevProps.cluster
    const currCluster = this.props.cluster
    if (prevCluster && currCluster && prevCluster.id !== currCluster.id) {
      this.setState(initialEditorState, () => this.setUp())
    }
  }


  async setUp() {
    try {
      await this.startCluster()
      const {
        notebookName, namespace, name: workspaceName, app,
        cluster: { clusterName, clusterUrl, error },
        workspace: { workspace: { bucketName } },
        ajax: { Buckets, Jupyter }
      } = this.props

      if (error) {
        this.setState({ clusterError: error, failed: true })
        return
      }

      await Promise.all([
        this.localizeNotebook(clusterName),
        Jupyter.notebooks(namespace, clusterName).setCookie()
      ])

      const { updated } = await Buckets.notebook(namespace, bucketName, notebookName.slice(0, -6)).getObject()
      const tenMinutesAgo = _.tap(d => d.setMinutes(d.getMinutes() - 10), new Date())
      const isRecent = new Date(updated) > tenMinutesAgo
      if (isRecent) {
        notify('warn', 'This notebook has been edited recently', {
          message: 'If you recently edited this notebook, disregard this message. If another user is editing this notebook, your changes may be lost.',
          timeout: 30000
        })
      }

      if (app === 'lab') {
        this.setState({ url: `${clusterUrl}/lab/tree/${workspaceName}/${notebookName}` })
        notify('warn', 'Autosave occurs every 2 minutes', {
          message: `Please remember to save your notebook by clicking the save icon before exiting the window. JupyterLab is new in Terra.
                    We are working to improve its integration. Please contact us with any questions or feedback you may have.`,
          timeout: 30000
        })
      } else {
        Nav.blockNav.set(() => new Promise(resolve => {
          if (this.isSaved.get()) {
            resolve()
          } else {
            this.saveNotebook()
            this.setState({ saving: true })
            this.isSaved.subscribe(resolve)
          }
        }))
        this.setState({ url: `${clusterUrl}/notebooks/${workspaceName}/${notebookName}` })
      }
    } catch (error) {
      if (this.mounted) {
        reportError('Notebook cannot be launched', error)
        this.setState({ failed: true })
      }
    }
  }

  async startCluster() {
    const { refreshClusters, ajax: { Jupyter } } = this.props
    await refreshClusters()

    while (this.mounted) {
      await refreshClusters()
      const cluster = this.props.cluster // Note: reading up-to-date prop
      const status = cluster && cluster.status

      if (status === 'Running') {
        return
      } else if (status === 'Stopped') {
        const { googleProject, clusterName } = cluster
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
          this.setState({ failed: true })
          throw new Error('Unable to copy notebook to cluster, was it renamed or deleted in the Workspace Bucket?')
        }
      }
    }
  }

  render() {
    const { namespace, name, app, cluster } = this.props
    const { clusterError, localizeFailures, failed, url, saving, createOpen, createRequested } = this.state
    const clusterStatus = cluster && cluster.status

    if (url) {
      return h(Fragment, [
        iframe({
          src: url,
          style: { border: 'none', flex: 1 },
          ref: this.notebookFrame
        }),
        app === 'lab' && linkButton({
          style: { position: 'absolute', top: 1, right: 30 },
          onClick: () => Nav.goToPath('workspace-notebooks', { namespace, name })
        }, [icon('times-circle', { size: 25 })]),
        saving && spinnerOverlay
      ])
    } else {
      const isCreating = clusterStatus === 'Creating'
      const isRunning = clusterStatus === 'Running'
      const currentStep = isRunning ? 2 : 1

      const makeStep = (index, shortText, fullText) => {
        const isCurrent = index === currentStep
        const isComplete = index < currentStep
        const isIncomplete = index > currentStep
        const stepCond = (current, complete, incomplete) => isCurrent ? current : isComplete ? complete : incomplete
        const baseColor = stepCond(colors.blue, colors.green, colors.gray)

        return div({
          style: {
            marginRight: '1rem', padding: '0.5rem 1rem',
            borderRadius: '1rem', border: `1px solid ${baseColor[0]}`,
            backgroundColor: stepCond(colors.blue[1], colors.green[1], colors.gray[6]),
            color: isIncomplete ? undefined : 'white',
            fontWeight: isCurrent ? 600 : undefined
          }
        }, [
          !isIncomplete && icon(isCurrent ? 'loadingSpinner' : 'success-standard', {
            className: 'is-solid',
            style: { marginRight: '0.5rem' }
          }),
          isCurrent ? fullText : shortText
        ])
      }

      return h(Fragment, [
        (cluster || createRequested) ?
          div({ style: { padding: '2rem', display: 'flex' } }, [
            failed ?
              h(Fragment, [
                icon('times', { size: 24, style: { color: colors.red[0], marginRight: '1rem' } }),
                clusterError || 'Error launching notebook.'
              ]) :
              h(Fragment, [
                makeStep(1, 'Runtime started', (isCreating || createRequested) ?
                  'Creating notebook runtime environment. You can navigate away and return in 5-10 minutes.' :
                  'Starting notebook runtime environment, this may take up to 2 minutes.'
                ),
                makeStep(2, 'Copy notebook', localizeFailures ?
                  `Error loading notebook, retry number ${localizeFailures}...` :
                  'Copying notebook to the runtime.'
                )
              ])
          ]) :
          div({ style: { padding: '2rem', fontSize: 16, fontWeight: 'bold' } }, [
            'You are viewing this notebook in read-only mode. You can ',
            linkButton({ onClick: () => this.setState({ createOpen: true }) }, 'create a notebooks runtime'),
            ' to edit and run it.'
          ]),
        div({ style: { color: colors.gray[2], fontSize: 14, fontWeight: 'bold', padding: '0 0 0 2rem' } }, [
          isRunning ? 'Almost ready...' : 'Read-only preview of your notebook:'
        ]),
        !isRunning && h(NotebookPreviewFrame, this.props),
        createOpen && h(NewClusterModal, {
          namespace, currentCluster: cluster,
          onCancel: () => this.setState({ createOpen: false }),
          onSuccess: async promise => {
            this.setState({ createOpen: false })
            try {
              this.setState({ createRequested: true })
              await promise
              this.setUp()
            } catch (e) {
              reportError('Error creating cluster', e)
            }
          }
        })
      ])
    }
  }
}


export const addNavPaths = () => {
  Nav.defPath('workspace-notebook-launch', {
    path: '/workspaces/:namespace/:name/notebooks/launch/:notebookName/:app?',
    component: NotebookLauncher,
    title: ({ name, notebookName }) => `${name} - Notebooks - ${notebookName}`
  })
}
