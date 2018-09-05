import { div, h } from 'react-hyperscript-helpers'
import ReactMarkdown from 'react-markdown'
import SimpleMDE from 'react-simplemde-editor'
import 'simplemde/dist/simplemde.min.css'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { buttonPrimary, buttonSecondary, link, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const styles = {
  leftBox: {
    flex: 1, padding: '2rem'
  },
  rightBox: {
    flex: 'none', width: 350, backgroundColor: 'white',
    padding: '2rem 1rem 1rem'
  },
  header: {
    ...Style.elements.sectionHeader, textTransform: 'uppercase',
    marginBottom: '1rem'
  },
  infoTile: {
    backgroundColor: colors.gray[5], color: 'black',
    borderRadius: 5, width: 90, padding: 7, margin: 4
  },
  tinyCaps: {
    fontSize: 8, fontWeight: 500, textTransform: 'uppercase'
  },
  label: {
    ...Style.elements.sectionHeader,
    marginTop: '1rem', marginBottom: '0.25rem'
  }
}

const roleString = {
  READER: 'Reader',
  WRITER: 'Writer',
  OWNER: 'Owner',
  PROJECT_OWNER: 'Proj. Owner'
}

const InfoTile = ({ title, children }) => {
  return div({ style: styles.infoTile }, [
    div({ style: styles.tinyCaps }, [title]),
    div({ style: { fontSize: 12 } }, [children])
  ])
}

const EditWorkspaceModal = ajaxCaller(class EditWorkspaceModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      description: props.workspace.workspace.attributes.description || '',
      saving: false
    }
  }

  async save() {
    const { onSave, workspace: { workspace: { namespace, name } }, ajax: { Workspaces } } = this.props
    const { description } = this.state
    try {
      this.setState({ saving: true })
      await Workspaces.workspace(namespace, name).shallowMergeNewAttributes({ description })
      onSave()
    } catch (error) {
      reportError('Error saving workspace', error)
    } finally {
      this.setState({ saving: false })
    }
  }

  render() {
    const { onDismiss } = this.props
    const { description, saving } = this.state
    return h(Modal, {
      title: 'Edit workspace',
      onDismiss,
      width: 500,
      okButton: buttonPrimary({
        onClick: () => this.save()
      }, ['Save'])
    }, [
      div({ style: styles.label }, ['Description']),
      h(SimpleMDE, {
        options: {
          autofocus: true,
          placeholder: 'Enter a description',
          status: false
        },
        value: description,
        onChange: description => this.setState({ description })
      }),
      saving && spinnerOverlay
    ])
  }
})

export const WorkspaceDashboard = ajaxCaller(wrapWorkspace({
  breadcrumbs: () => breadcrumbs.commonPaths.workspaceList(),
  activeTab: 'dashboard'
},
class WorkspaceDashboardContent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      submissionsCount: undefined,
      storageCostEstimate: undefined,
      editingWorkspace: false
    }
  }

  async componentDidMount() {
    const { ajax: { Workspaces }, namespace, name, workspace: { accessLevel } } = this.props
    try {
      const [submissions, estimate] = await Promise.all([
        Workspaces.workspace(namespace, name).listSubmissions(),
        Utils.canWrite(accessLevel) ?
          Workspaces.workspace(namespace, name).storageCostEstimate() :
          undefined
      ])
      this.setState({
        submissionsCount: submissions.length,
        storageCostEstimate: estimate && estimate.estimate
      })
    } catch (error) {
      reportError('Error loading data', error)
    }
  }

  render() {
    const { workspace, refreshWorkspace, workspace: { accessLevel, workspace: { createdDate, lastModified, bucketName, attributes: { description } } } } = this.props
    const { submissionsCount, storageCostEstimate, editingWorkspace } = this.state
    const canWrite = Utils.canWrite(accessLevel)
    return div({ style: { flex: 1, display: 'flex', marginBottom: '-2rem' } }, [
      div({ style: styles.leftBox }, [
        div({ style: styles.header }, [
          'About the project',
          buttonSecondary({
            style: { width: '2rem' },
            disabled: !canWrite,
            tooltip: !canWrite && 'You do not have permission to edit this workspace',
            onClick: () => this.setState({ editingWorkspace: true })
          }, [icon('edit')])
        ]),
        description ?
          h(ReactMarkdown, [description]) :
          div({ style: { fontStyle: 'italic' } }, ['No description added'])
      ]),
      div({ style: styles.rightBox }, [
        div({ style: styles.header }, ['Workspace information']),
        div({ style: { display: 'flex', flexWrap: 'wrap', margin: -4 } }, [
          h(InfoTile, { title: 'Creation date' }, [new Date(createdDate).toLocaleDateString()]),
          h(InfoTile, { title: 'Last updated' }, [new Date(lastModified).toLocaleDateString()]),
          h(InfoTile, { title: 'Submissions' }, [submissionsCount]),
          h(InfoTile, { title: 'Access level' }, [roleString[accessLevel]]),
          Utils.canWrite(accessLevel) && h(InfoTile, { title: 'Est. $/month' }, [
            storageCostEstimate
          ])
        ]),
        div({ style: { margin: '0.5rem 0', borderBottom: `1px solid ${colors.gray[3]}` } }),
        link({
          target: '_blank',
          href: Utils.bucketBrowserUrl(bucketName),
          style: styles.tinyCaps
        }, ['Google bucket'])
      ]),
      editingWorkspace && h(EditWorkspaceModal, {
        workspace,
        onDismiss: () => this.setState({ editingWorkspace: false }),
        onSave: () => {
          this.setState({ editingWorkspace: false })
          refreshWorkspace()
        }
      })
    ])
  }
}))

export const addNavPaths = () => {
  Nav.defPath('workspace', {
    path: '/workspaces/:namespace/:name',
    component: WorkspaceDashboard,
    title: ({ name }) => `${name} - Dashboard`
  })
}
