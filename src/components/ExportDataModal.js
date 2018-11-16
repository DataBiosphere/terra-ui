import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { div, h } from 'react-hyperscript-helpers'
import { buttonPrimary, spinnerOverlay } from 'src/components/common'
import ErrorView from 'src/components/ErrorView'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { withWorkspaces, WorkspaceSelector } from 'src/components/workspace-utils'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import { requiredFormLabel, formLabel } from 'src/libs/forms'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import validate from 'validate.js'


export default _.flow(
  ajaxCaller,
  withWorkspaces()
)(class ExportDataModal extends Component {
  static propTypes = {
    onDismiss: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    selectedEntities: PropTypes.array.isRequired,
    selectedDataType: PropTypes.string.isRequired,
    runningSubmissionsCount: PropTypes.number.isRequired
  }

  constructor(props) {
    super(props)

    this.state = {
      additionalCopies: [],
      selectedWorkspaceId: undefined,
      error: undefined,
      copying: false
    }
  }

  getSelectedWorkspace() {
    const { workspaces } = this.props
    const { selectedWorkspaceId } = this.state
    return _.find({ workspace: { workspaceId: selectedWorkspaceId } }, workspaces)
  }

  render() {
    const { copied } = this.state
    return copied ? this.renderPostCopy() : this.renderCopyForm()
  }

  renderCopyForm() {
    const { onDismiss, selectedEntities, runningSubmissionsCount, workspace, workspaces } = this.props
    const { copying, additionalCopies, error, selectedWorkspaceId } = this.state
    const moreToCopy = !!additionalCopies.length

    const warningStyle = {
      border: `1px solid ${colors.orange[1]}`, borderLeft: 'none', borderRight: 'none',
      backgroundColor: colors.orange[4],
      padding: '1rem 1.25rem', margin: '0 -1.25rem',
      color: colors.orange[0], fontWeight: 'bold', fontSize: 12
    }
    const errors = validate(
      { selectedWorkspaceId },
      { selectedWorkspaceId: { presence: true } },
      { prettify: v => (validate.prettify(v)) }
    )
    return h(Modal, {
      onDismiss,
      title: 'Copy to Workspace',
      okButton: buttonPrimary({
        tooltip: Utils.summarizeErrors(errors),
        disabled: !!errors || copying,
        onClick: () => this.copy()
      }, ['Copy'])
    }, [
      runningSubmissionsCount > 0 && div({ style: { ...warningStyle, display: 'flex', alignItems: 'center' } }, [
        icon('warning-standard', { size: 36, className: 'is-solid', style: { flex: 'none', marginRight: '0.5rem' } }),
        `WARNING: ${runningSubmissionsCount} workflows are currently running in this workspace. ` +
        'Copying the following data could cause failures if a workflow is using this data.'
      ]),
      requiredFormLabel('Destination'),
      h(WorkspaceSelector, {
        workspaces: _.filter(({ workspace: { workspaceId }, accessLevel }) => {
          return workspace.workspaceId !== workspaceId && Utils.canWrite(accessLevel)
        }, workspaces),
        value: selectedWorkspaceId,
        onChange: v => this.setState({ selectedWorkspaceId: v })
      }),
      moreToCopy && div({ style: { ...warningStyle, display: 'flex', alignItems: 'center' } }, [
        icon('warning-standard', { size: 36, className: 'is-solid', style: { flex: 'none', marginRight: '0.5rem' } }),
        'In order to copy the selected data entries, the following entries that reference them must also be copied.'
      ]),
      formLabel('Entries selected'),
      ..._.map(([i, entity]) => div({
        style: {
          borderTop: (i === 0 && runningSubmissionsCount === 0) ? undefined : Style.standardLine,
          padding: '0.6rem 1.25rem', margin: '0 -1.25rem'
        }
      }, moreToCopy ? `${entity.entityName} (${entity.entityType})` : entity),
      Utils.toIndexPairs(moreToCopy ? additionalCopies : selectedEntities)),
      div({
        style: { ...warningStyle, textAlign: 'right' }
      }, [`${selectedEntities.length + additionalCopies.length} data entries to be copied.`]),
      copying && spinnerOverlay,
      error && h(ErrorView, { error, collapses: false })
    ])
  }

  async copy() {
    const { onDismiss, onSuccess, selectedEntities, selectedDataType, workspace, ajax: { Workspaces } } = this.props
    const { additionalCopies } = this.state
    const entitiesToCopy = _.concat(_.map(entityName => (entityName), selectedEntities), additionalCopies)
    const selectedWorkspace = this.getSelectedWorkspace().workspace

    this.setState({ copying: true })
    try {
      await Workspaces.workspace(workspace.workspace.namespace, workspace.workspace.name).copyEntities(selectedWorkspace.namespace, selectedWorkspace.name, selectedDataType, entitiesToCopy)
      onSuccess()
    } catch (error) {
      switch (error.status) {
        case 409:
          this.setState({ additionalCopies: _.filter(entity => entity.entityType !== selectedDataType, await error.json()), copying: false })
          break
        default:
          reportError('Error copying data entries', error)
          onDismiss()
      }
    }
  }
})
