import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import SimpleMDE from 'react-simplemde-editor'
import 'simplemde/dist/simplemde.min.css'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { buttonPrimary, buttonSecondary, link, linkButton, Markdown, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
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
    flex: 1, padding: '0 2rem'
  },
  rightBox: {
    flex: 'none', width: 350, backgroundColor: colors.gray[5],
    padding: '0 1rem'
  },
  header: {
    ...Style.elements.sectionHeader, textTransform: 'uppercase',
    margin: '2.5rem 0 1rem 0', display: 'flex'
  },
  infoTile: {
    backgroundColor: colors.gray[4], color: 'black',
    width: 125, padding: 7, margin: 4
  },
  tinyCaps: {
    fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', color: colors.darkBlue[0]
  },
  authDomain: {
    padding: '0.5rem 0.25rem', marginBottom: '0.25rem',
    backgroundColor: colors.gray[4],
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
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

export const WorkspaceDashboard = _.flow(
  wrapWorkspace({
    breadcrumbs: () => breadcrumbs.commonPaths.workspaceList(),
    activeTab: 'dashboard'
  }),
  ajaxCaller
)(class WorkspaceDashboard extends Component {
  constructor(props) {
    super(props)
    this.state = {
      submissionsCount: undefined,
      storageCostEstimate: undefined,
      editDescription: undefined,
      saving: false
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

  async save() {
    const { refreshWorkspace, workspace: { workspace: { namespace, name } }, ajax: { Workspaces } } = this.props
    const { editDescription: description } = this.state
    try {
      this.setState({ saving: true })
      await Workspaces.workspace(namespace, name).shallowMergeNewAttributes({ description })
      await refreshWorkspace()
    } catch (error) {
      reportError('Error saving workspace', error)
    } finally {
      this.setState({ editDescription: undefined, saving: false })
    }
  }

  render() {
    const {
      workspace: {
        accessLevel,
        workspace: {
          authorizationDomain, createdDate, lastModified, bucketName,
          attributes: { description = '' }
        }
      }
    } = this.props
    const { submissionsCount, storageCostEstimate, editDescription, saving } = this.state
    const canWrite = Utils.canWrite(accessLevel)
    const isEditing = _.isString(editDescription)

    return div({ style: { flex: 1, display: 'flex' } }, [
      div({ style: styles.leftBox }, [
        div({ style: styles.header }, [
          'About the project',
          !isEditing && linkButton({
            style: { marginLeft: '0.5rem' },
            disabled: !canWrite,
            tooltip: !canWrite && 'You do not have permission to edit this workspace',
            onClick: () => this.setState({ editDescription: description })
          }, [icon('edit', { className: 'is-solid' })])
        ]),
        Utils.cond(
          [
            isEditing, () => h(Fragment, [
              h(SimpleMDE, {
                options: {
                  autofocus: true,
                  placeholder: 'Enter a description',
                  status: false
                },
                value: editDescription,
                onChange: editDescription => this.setState({ editDescription })
              }),
              div({ style: { display: 'flex', justifyContent: 'flex-end', margin: '1rem' } }, [
                buttonSecondary({ onClick: () => this.setState({ editDescription: undefined }) }, 'Cancel'),
                buttonPrimary({ style: { marginLeft: '1rem' }, onClick: () => this.save() }, 'Save')
              ]),
              saving && spinnerOverlay
            ])
          ],
          [!!description, () => h(Markdown, [description])],
          () => div({ style: { fontStyle: 'italic' } }, ['No description added']))
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
        !_.isEmpty(authorizationDomain) && h(Fragment, [
          div({ style: styles.header }, ['Authorization Domain']),
          div({ style: { marginBottom: '0.5rem' } }, [
            'Collaborators must be a member of all of these ',
            link({
              href: Nav.getLink('groups'),
              target: '_blank'
            }, 'groups'),
            ' to access this workspace.'
          ]),
          ..._.map(({ membersGroupName }) => div({ style: styles.authDomain }, [membersGroupName]), authorizationDomain)
        ]),
        div({ style: { margin: '1.5rem 0 0.5rem 0', borderBottom: `1px solid ${colors.gray[3]}` } }),
        link({
          target: '_blank',
          href: Utils.bucketBrowserUrl(bucketName),
          style: { display: 'block', marginBottom: '3rem' }
        }, ['Google bucket'])
      ])
    ])
  }
})

export const addNavPaths = () => {
  Nav.defPath('workspace-dashboard', {
    path: '/workspaces/:namespace/:name',
    component: WorkspaceDashboard,
    title: ({ name }) => `${name} - Dashboard`
  })
}
