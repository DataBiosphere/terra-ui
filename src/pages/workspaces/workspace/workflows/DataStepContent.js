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
    const { rootEntityType, entitySelectionModel } = props
    this.state = { rootEntityType, entitySelectionModel }
  }

  setEntitySelectionModel(modelUpdates) {
    this.setState(({ entitySelectionModel }) => {
      return { entitySelectionModel: { ...entitySelectionModel, ...modelUpdates } }
    })
  }

  isValidSelectionModel() {
    const { entitySelectionModel } = this.state
    const { newSetName, selectedEntities, type } = entitySelectionModel
    const selectionSize = _.size(selectedEntities)

    return (type === EntitySelectionType.processAll ||
      (selectionSize > 0 && !!newSetName && (type !== EntitySelectionType.chooseSet || selectionSize <= 10))
    )
  }

  render() {
    const {
      onDismiss, onSuccess,
      workspaceId, entityMetadata,
      workspace: { attributes: { 'workspace-column-defaults': columnDefaults } }
    } = this.props
    const { entitySelectionModel, entitySelectionModel: { type, selectedEntities, newSetName }, rootEntityType } = this.state

    const count = rootEntityType && entityMetadata[rootEntityType].count

    const isSet = _.endsWith('_set', rootEntityType)
    const setType = `${rootEntityType}_set`
    const hasSet = _.has(setType, entityMetadata)

    const isProcessAll = type === EntitySelectionType.processAll
    const isProcessFromSet = type === EntitySelectionType.processFromSet
    const isChooseRows = type === EntitySelectionType.chooseRows

    return h(Modal, {
      title: 'Select Data',
      okButton: h(ButtonPrimary, {
        disabled: !this.isValidSelectionModel(),
        onClick: () => onSuccess(entitySelectionModel)
      }, 'OK'),
      onDismiss,
      width: 'calc(100% - 2rem)'
    }, [
      div({ style: { ...Style.elements.sectionHeader, marginBottom: '1rem' } },
        [`Select ${(isSet ? 'up to 10 ' : '') + rootEntityType}s to process`]),
      rootEntityType && div({
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
              onChange: () => this.setEntitySelectionModel({ type: EntitySelectionType.processAll, selectedEntities: {} }),
              labelStyle: { marginLeft: '0.75rem' }
            })
          ]),
          div([
            h(RadioButton, {
              text: 'Choose specific rows to process',
              name: 'process-rows',
              checked: isChooseRows,
              onChange: () => this.setEntitySelectionModel({ type: EntitySelectionType.chooseRows, selectedEntities: {} }),
              labelStyle: { marginLeft: '0.75rem' }
            })
          ]),
          hasSet && div([
            h(RadioButton, {
              text: 'Choose existing sets',
              name: 'process-rows',
              checked: isProcessFromSet,
              onChange: () => this.setEntitySelectionModel({ type: EntitySelectionType.processFromSet, selectedEntities: {} }),
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
            key: type,
            entityType: isProcessFromSet ? setType : rootEntityType,
            entityMetadata, workspaceId, columnDefaults,
            selectionModel: {
              type: 'multiple',
              selected: selectedEntities, setSelected: e => this.setEntitySelectionModel({ selectedEntities: e })
            }
          })
        ]),
        (isProcessAll ||
          ((isChooseRows || isProcessFromSet) && _.size(selectedEntities) > 1)) && h(IdContainer, [id => div({
          style: { marginTop: '1rem' }
        }, [
          label({ htmlFor: id }, [`Selected rows will ${isProcessFromSet ? 'have their membership combined into' : 'be saved as'} a new set named:`]),
          h(TextInput, {
            id,
            style: { width: 500, marginLeft: '0.25rem' },
            value: newSetName,
            onChange: v => this.setEntitySelectionModel({ newSetName: v })
          })
        ])])
      ])
    ])
  }
}
