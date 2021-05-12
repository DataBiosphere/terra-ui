import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Component } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer, RadioButton } from 'src/components/common'
import DataTable from 'src/components/data/DataTable'
import { ValidatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { FormLabel } from 'src/libs/forms'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { chooseBaseType, chooseRootType, chooseSetType } from 'src/pages/workspaces/workspace/workflows/EntitySelectionType'
import validate from 'validate.js'


export default class DataStepContent extends Component {
  static propTypes = {
    entityMetadata: PropTypes.objectOf(PropTypes.shape({
      count: PropTypes.number.isRequired
    })).isRequired,
    entitySelectionModel: PropTypes.shape({
      newSetName: PropTypes.string.isRequired,
      selectedElements: PropTypes.array,
      type: PropTypes.oneOf([chooseSetType, chooseRootType, chooseBaseType])
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
    const { newSelectionModel: { newSetName, selectedEntities } } = this.state
    return _.size(selectedEntities) > 0 && (newSetName || !this.willCreateSet())
  }

  willCreateSet() {
    const { newSelectionModel: { selectedEntities, type } } = this.state
    return type === chooseBaseType || _.size(selectedEntities) > 1
  }

  render() {
    const {
      onDismiss, onSuccess,
      workspaceId, entityMetadata, rootEntityType,
      workspace: { attributes: { 'workspace-column-defaults': columnDefaults } }
    } = this.props
    const { newSelectionModel, newSelectionModel: { type, selectedEntities, newSetName } } = this.state

    const isSet = _.endsWith('_set', rootEntityType)
    const setType = `${rootEntityType}_set`
    const hasSet = _.has(setType, entityMetadata)
    const hasEntityType = _.has(rootEntityType, entityMetadata)
    const baseEntityType = isSet ? rootEntityType.slice(0, -4) : rootEntityType

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
        tooltip: _.isEmpty(selectedEntities) ? 'Please select data' : undefined,
        disabled: !!errors || !this.isValidSelectionModel(),
        onClick: () => onSuccess(newSelectionModel)
      }, 'OK'),
      onDismiss,
      width: 'calc(100% - 2rem)'
    }, [
      div({
        style: {
          padding: '1rem 0.5rem', lineHeight: '1.5rem'
        }
      }, [
        div({ role: 'radiogroup', 'aria-label': 'Select entities' }, [
          isSet && div([
            h(RadioButton, {
              text: `Create a new ${rootEntityType} from selected ${baseEntityType}s`,
              name: 'select-data',
              checked: type === chooseBaseType,
              onChange: () => this.setNewSelectionModel({ type: chooseBaseType, selectedEntities: {} }),
              labelStyle: { marginLeft: '0.75rem' }
            })
          ]),
          hasEntityType && div([
            h(RadioButton, {
              text: `Choose specific ${rootEntityType}s to process`,
              name: 'select-data',
              checked: type === chooseRootType,
              onChange: () => this.setNewSelectionModel({ type: chooseRootType, selectedEntities: {} }),
              labelStyle: { marginLeft: '0.75rem' }
            })
          ]),
          hasSet && div([
            h(RadioButton, {
              text: `Choose existing sets of ${rootEntityType}s`,
              name: 'select-data',
              checked: type === chooseSetType,
              onChange: () => this.setNewSelectionModel({ type: chooseSetType, selectedEntities: {} }),
              labelStyle: { marginLeft: '0.75rem' }
            })
          ])
        ]),
        div({
          style: {
            display: 'flex', flexDirection: 'column',
            height: 500, marginTop: '1rem'
          }
        }, [
          h(DataTable, {
            key: type.description,
            childrenBefore: () => div({ style: Style.elements.sectionHeader }, [
              Utils.switchCase(type,
                [chooseSetType, () => `Select one or more ${setType}s to combine and process`],
                [chooseRootType, () => `Select ${rootEntityType}s to process`],
                [chooseBaseType, () => `Select ${baseEntityType}s to create a new ${rootEntityType} to process`]
              )
            ]),
            entityType: Utils.switchCase(type,
              [chooseBaseType, () => baseEntityType],
              [chooseRootType, () => rootEntityType],
              [chooseSetType, () => setType]
            ),
            entityMetadata, workspaceId, columnDefaults,
            selectionModel: {
              selected: selectedEntities, setSelected: e => this.setNewSelectionModel({ selectedEntities: e })
            }
          })
        ]),
        this.willCreateSet() && h(IdContainer,
          [id => div({ style: { marginTop: '1rem' } }, [
            h(FormLabel, { htmlFor: id }, [
              Utils.switchCase(type,
                [chooseSetType, () => `Selected ${setType}s will have their membership combined into a new ${setType} named:`],
                [chooseBaseType, () => `Selected ${baseEntityType}s will be saved as a new ${rootEntityType} named:`],
                [chooseRootType, () => `Selected ${rootEntityType}s will be saved as a new ${setType} named:`]
              )
            ]),
            h(ValidatedInput, {
              inputProps: {
                id, value: newSetName, style: { marginLeft: '0.25rem' },
                onChange: v => this.setNewSelectionModel({ newSetName: v })
              },
              width: 500,
              error: Utils.summarizeErrors(errors?.newSetName)
            })
          ])])
      ])
    ])
  }
}
