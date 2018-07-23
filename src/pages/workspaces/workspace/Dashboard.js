import { Component } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { link } from 'src/components/common'
import { Workspaces } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
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
    backgroundColor: Style.colors.background, color: 'black',
    borderRadius: 5, width: 90, padding: 7, margin: 4
  },
  tinyCaps: {
    fontSize: 8, fontWeight: 500, textTransform: 'uppercase'
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

export const WorkspaceDashboard = wrapWorkspace({
  breadcrumbs: () => breadcrumbs.commonPaths.workspaceList(),
  activeTab: 'dashboard'
},
class WorkspaceDashboardContent extends Component {
  constructor(props) {
    super(props)
    this.state = { submissionsCount: undefined, storageCostEstimate: undefined }
  }

  async componentDidMount() {
    const { namespace, name } = this.props
    try {
      const [submissions, estimate] = await Promise.all([
        Workspaces.workspace(namespace, name).listSubmissions(),
        Workspaces.workspace(namespace, name).storageCostEstimate()
      ])
      this.setState({
        submissionsCount: submissions.length,
        storageCostEstimate: estimate.estimate
      })
    } catch (error) {
      reportError('Error loading data', error)
    }
  }

  render() {
    const { workspace: { accessLevel, workspace: { createdDate, bucketName, attributes: { description } } } } = this.props
    const { submissionsCount, storageCostEstimate } = this.state
    return div({ style: { flex: 1, display: 'flex', marginBottom: '-2rem' } }, [
      div({ style: styles.leftBox }, [
        div({ style: styles.header }, ['About the project']),
        description ?
          div({ style: { whiteSpace: 'pre-wrap' } }, [description]) :
          div({ style: { fontStyle: 'italic' } }, ['No description added'])
      ]),
      div({ style: styles.rightBox }, [
        div({ style: styles.header }, ['Workspace information']),
        div({ style: { display: 'flex', flexWrap: 'wrap', margin: -4 } }, [
          h(InfoTile, { title: 'Creation date' }, [new Date(createdDate).toLocaleDateString()]),
          h(InfoTile, { title: 'Submissions' }, [submissionsCount]),
          h(InfoTile, { title: 'Access level' }, [roleString[accessLevel]]),
          h(InfoTile, { title: 'Est. $/month' }, [storageCostEstimate])
        ]),
        div({ style: { margin: '0.5rem 0', borderBottom: `1px solid ${Style.colors.border}` } }),
        link({
          target: '_blank',
          href: Utils.bucketBrowserUrl(bucketName),
          style: styles.tinyCaps
        }, ['Google bucket'])
      ])
    ])
  }
})

export const addNavPaths = () => {
  Nav.defPath('workspace', {
    path: '/workspaces/:namespace/:name',
    component: WorkspaceDashboard,
    title: ({ name }) => `${name} - Dashboard`
  })
}
