import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Component } from 'react'
import { div, h, label } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer, RadioButton } from 'src/components/common'
import DataTable from 'src/components/DataTable'
import { TextInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import * as Style from 'src/libs/style'
import EntitySelectionType from 'src/pages/workspaces/workspace/workflows/EntitySelectionType'
import validate from 'validate.js'


const { processAll, processMergedSet, chooseRows, chooseSets } = EntitySelectionType

export default class DataStepContent extends Component {
  static propTypes = {
    entityMetadata: PropTypes.objectOf(PropTypes.shape({
      count: PropTypes.number.isRequired
    })).isRequired,
    entitySelectionModel: PropTypes.shape({
      newSetName: PropTypes.string.isRequired,
      selectedElements: PropTypes.array,
      type: PropTypes.oneOf(_.values(EntitySelectionType))
    }),
    onDismiss: PropTypes.func,
    onSuccess: PropTypes.func,
    rootEntityType: PropTypes.string,
    workspaceId: PropTypes.object
  }

  constructor(props) {
    super(props)
    const { entitySelectionModel } = props
    this.state = { newSelectionModel: entitySelectionModel }
  }

  setNewSelectionModel(modelUpdates) {
    this.setState(({ newSelectionModel }) => {
      return { newSelectionModel: { ...newSelectionModel, ...modelUpdates } }
    })
  }

  isValidSelectionModel() {
    const { newSelectionModel: { newSetName, selectedEntities, type } } = this.state
    const selectionSize = _.size(selectedEntities)

    return selectionSize === 1 ||
      (type === processAll && !!newSetName) ||
      (type === chooseRows && !!newSetName && selectionSize > 1) ||
      (type === chooseSets && selectionSize > 1 && selectionSize <= 10) ||
      (type === processMergedSet && !!newSetName && selectionSize > 1)
  }

  render() {
    const {
      onDismiss, onSuccess,
      workspaceId, entityMetadata, rootEntityType,
      workspace: { attributes: { 'workspace-column-defaults': columnDefaults } }
    } = this.props
    const { newSelectionModel, newSelectionModel: { type, selectedEntities, newSetName, error: undefined } } = this.state

    const count = entityMetadata[rootEntityType].count

    const isSet = _.endsWith('_set', rootEntityType)
    const setType = `${rootEntityType}_set`
    const hasSet = _.has(setType, entityMetadata)

    const isProcessAll = type === processAll
    const isProcessMergedSet = type === processMergedSet
    const isChooseRows = type === chooseRows
    const isChooseSets = type === chooseSets
    const errors = validate({ newSetName }, {
      newSetName: {
        presence: { allowEmpty: false },
        format: {
          pattern: /^[A-Za-z0-9_\-.]*$/,
          message: 'can only contain letters, numbers, underscores, dashes, and periods'
        }
      }
    })

    return h(Modal, {
      title: 'Select Data',
      okButton: h(ButtonPrimary, {
        tooltip: isChooseSets && _.size(selectedEntities) > 10 && 'Please select 10 or fewer sets',
        disabled: !this.isValidSelectionModel() && !!errors,
        onClick: () => onSuccess(newSelectionModel)
      }, 'OK'),
      onDismiss,
      width: 'calc(100% - 2rem)'
    }, [
      div({ style: { ...Style.elements.sectionHeader, marginBottom: '1rem' } },
        [`Select ${(isSet ? 'up to 10 ' : '') + rootEntityType}s to process${isSet ? ' in parallel' : ''}`]),
      div({
        style: {
          padding: '1rem 0.5rem', lineHeight: '1.5rem'
        }
      }, [
        !isSet && h(div, { role: 'radiogroup', 'aria-label': 'Select entities' }, [
          div([
            h(RadioButton, {
              text: `Process all ${count} rows`,
              name: 'process-rows',
              checked: isProcessAll,
              onChange: () => this.setNewSelectionModel({ type: processAll, selectedEntities: {} }),
              labelStyle: { marginLeft: '0.75rem' }
            })
          ]),
          div([
            h(RadioButton, {
              text: 'Choose specific rows to process',
              name: 'process-rows',
              checked: isChooseRows,
              onChange: () => this.setNewSelectionModel({ type: chooseRows, selectedEntities: {} }),
              labelStyle: { marginLeft: '0.75rem' }
            })
          ]),
          hasSet && div([
            h(RadioButton, {
              text: 'Choose existing sets',
              name: 'process-rows',
              checked: isProcessMergedSet,
              onChange: () => this.setNewSelectionModel({ type: processMergedSet, selectedEntities: {} }),
              labelStyle: { marginLeft: '0.75rem' }
            })
          ])
        ]),
        !isProcessAll && div({
          style: {
            display: 'flex', flexDirection: 'column',
            height: 500, marginTop: '1rem'
          }
        }, [
          h(DataTable, {
            key: type.description,
            entityType: isProcessMergedSet ? setType : rootEntityType,
            entityMetadata, workspaceId, columnDefaults,
            selectionModel: {
              type: 'multiple',
              selected: selectedEntities, setSelected: e => this.setNewSelectionModel({ selectedEntities: e })
            }
          })
        ]),
        (isProcessAll ||
          ((isChooseRows || isProcessMergedSet) && _.size(selectedEntities) > 1)) && h(IdContainer, [id => div({
          style: { marginTop: '1rem' }
        }, [
          label({ htmlFor: id }, [`Selected rows will ${isProcessMergedSet ? 'have their membership combined into' : 'be saved as'} a new set named:`]),
          h(TextInput, {
            id,
            style: { width: 500, marginLeft: '0.25rem' },
            value: newSetName,
            onChange: v => this.setNewSelectionModel({ newSetName: v })
          })
        ])])
      ])
    ])
  }
}
