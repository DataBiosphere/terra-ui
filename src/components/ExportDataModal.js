import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { b, div, h } from 'react-hyperscript-helpers'
import { buttonPrimary, spinnerOverlay } from 'src/components/common'
import ErrorView from 'src/components/ErrorView'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { withWorkspaces, WorkspaceSelector } from 'src/components/workspace-utils'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import { formLabel, requiredFormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import validate from 'validate.js'


const InfoTile = ({ infoStyle, content, iconName }) => {
  return div({ style: { ...infoStyle, display: 'flex', alignItems: 'center' } }, [
    icon(iconName, { size: 36, className: 'is-solid', style: { flex: 'none', marginRight: '0.5rem' } }),
    content
  ])
}


export default _.flow(
  ajaxCaller,
  withWorkspaces()
)(class ExportDataModal extends Component {
  static propTypes = {
    onDismiss: PropTypes.func.isRequired,
    selectedEntities: PropTypes.array.isRequired,
    selectedDataType: PropTypes.string.isRequired,
    runningSubmissionsCount: PropTypes.number.isRequired,
    workspace: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props)

    this.state = {
      hardConflicts: [],
      softConflicts: [],
      additionalDeletions: [],
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
    const { copying, hardConflicts, softConflicts, error, selectedWorkspaceId, additionalDeletions } = this.state
    const moreToDelete = !!additionalDeletions.length
    const warningStyle = {
      border: `1px solid ${colors.orange[1]}`, borderLeft: 'none', borderRight: 'none',
      backgroundColor: colors.orange[4],
      padding: '1rem 1.25rem', margin: '0 -1.25rem',
      color: colors.orange[0], fontWeight: 'bold', fontSize: 12
    }
    const errorStyle = {
      ...warningStyle,
      border: `1px solid ${colors.red[1]}`,
      backgroundColor: colors.red[4],
      color: colors.red[0]
    }

    const errors = validate(
      { selectedWorkspaceId },
      { selectedWorkspaceId: { presence: true } }
    )

    return h(Modal, {
      onDismiss,
      title: 'Copy to Workspace',
      okButton: buttonPrimary({
        tooltip: (hardConflicts.length !== 0) ? 'Override existing entities, are you sure?' : Utils.summarizeErrors(errors),
        disabled: !!errors || copying,
        onClick: () => this.copy()
      }, ['Copy'])
    }, [
      runningSubmissionsCount > 0 && InfoTile({
        infoStyle: warningStyle, iconName: 'warning-standard',
        content: `WARNING: ${runningSubmissionsCount} workflows are currently running in this workspace. ` +
          'Copying the following data could cause failures if a workflow is using this data.'
      }),
      requiredFormLabel('Destination'),
      h(WorkspaceSelector, {
        workspaces: _.filter(Utils.isValidWsExportTarget(workspace), workspaces),
        value: selectedWorkspaceId,
        onChange: v => this.setState({ selectedWorkspaceId: v })
      }),
      (hardConflicts.length !== 0) && InfoTile({
        infoStyle: errorStyle, iconName: 'error-standard',
        content: 'The following entries already exist in the selected workspace. Please select CANCEL to go back or COPY to override the existing entities. '
      }),
      moreToDelete && InfoTile({
        infoStyle: warningStyle, iconName: 'warning-standard',
        content: 'In order to override the selected data entries, the following entries that reference the original data must ALSO be deleted.'
      }),
      (softConflicts.length !== 0) && InfoTile({
        infoStyle: warningStyle, iconName: 'warning-standard',
        content: 'The following is linked to entries which already exist in the selected workspace. You may link the following to the existing entities by clicking COPY.'
      }),
      formLabel('Entries selected'),
      ...Utils.cond(
        [moreToDelete, () => this.displayEntities(additionalDeletions, runningSubmissionsCount, true)],
        [(hardConflicts.length !== 0), () => this.displayEntities(hardConflicts, runningSubmissionsCount, true)],
        [(softConflicts.length !== 0), () => this.displayEntities(softConflicts, runningSubmissionsCount, true)],
        () => this.displayEntities(selectedEntities, runningSubmissionsCount, false)
      ),
      div({
        style: { ...warningStyle, textAlign: 'right', marginTop: (hardConflicts.length !== 0) ? '1rem' : undefined }
      }, [`${selectedEntities.length} data entries to be copied.`]),
      copying && spinnerOverlay,
      error && h(ErrorView, { error, collapses: false })
    ])
  }

  renderPostCopy() {
    const { onDismiss } = this.props
    const selectedWorkspace = this.getSelectedWorkspace().workspace

    return h(Modal, {
      title: 'Copy to Workspace',
      onDismiss,
      cancelText: 'Stay Here',
      okButton: buttonPrimary({
        onClick: () => {
          Nav.goToPath('workspace-data', {
            namespace: selectedWorkspace.namespace,
            name: selectedWorkspace.name
          })
        }
      }, ['Go to copied data'])
    }, [
      'Successfully copied data to ',
      b([selectedWorkspace.name]),
      '. Do you want to view the copied data?'
    ])
  }

  displayEntities(entities, runningSubmissionsCount, showType) {
    return _.map(([i, entity]) => div({
      style: {
        borderTop: (i === 0 && runningSubmissionsCount === 0) ? undefined : Style.standardLine,
        padding: '0.6rem 1.25rem', margin: '0 -1.25rem'
      }
    }, showType ? `${entity.entityName} (${entity.entityType})` : entity),
    Utils.toIndexPairs(entities))
  }

  async copy() {
    const { onDismiss, selectedEntities, selectedDataType, workspace, ajax: { Workspaces } } = this.props
    const { additionalDeletions, hardConflicts, softConflicts } = this.state
    const selectedWorkspace = this.getSelectedWorkspace().workspace
    const entitiesToDelete = _.concat(hardConflicts, additionalDeletions)
    this.setState({ copying: true })
    if ((hardConflicts.length !== 0)) {
      try {
        await Workspaces.workspace(selectedWorkspace.namespace, selectedWorkspace.name).deleteEntities(entitiesToDelete)
        this.setState({ hardConflicts: [], additionalDeletions: [] })
      } catch (error) {
        switch (error.status) {
          case 409:
            this.setState({
              additionalDeletions: _.filter(entity => entity.entityType !== selectedDataType,
                await error.json()), copying: false
            }) //handles dangling references when deleting entities
            return
          default:
            reportError('Error deleting data entries', error)
            onDismiss()
        }
      }
    }
    try {
      await Workspaces.workspace(workspace.workspace.namespace, workspace.workspace.name)
        .copyEntities(selectedWorkspace.namespace, selectedWorkspace.name, selectedDataType, selectedEntities,
          (softConflicts.length !== 0))
      this.setState({ copied: true })
    } catch (error) {
      switch (error.status) {
        case 409:
          const { hardConflicts, softConflicts } = await error.json()
          this.setState({ hardConflicts, softConflicts, copying: false })
          break
        default:
          reportError('Error copying data entries', error)
          onDismiss()
      }
    }
  }
})
