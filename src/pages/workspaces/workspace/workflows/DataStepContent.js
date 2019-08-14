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
    const { entityType, name } = selectedEntities
    return (type === EntitySelectionType.processAll ||
      (type === EntitySelectionType.processFromSet && !!entityType && !!name) ||
      (_.size(selectedEntities) > 0 && !!newSetName))
  }

  render() {
    const {
      onDismiss, onSuccess,
      workspaceId, entityMetadata
    } = this.props
    const { entitySelectionModel, entitySelectionModel: { type, selectedEntities, newSetName }, rootEntityType } = this.state

    const count = rootEntityType && entityMetadata[rootEntityType].count

    const isSet = _.endsWith('_set', rootEntityType)
    const setType = `${rootEntityType}_set`
    const hasSet = _.has(setType, entityMetadata)

    return h(Modal, {
      title: 'Select Data',
      okButton: h(ButtonPrimary, {
        disabled: !this.isValidSelectionModel(),
        onClick: () => onSuccess(entitySelectionModel)
      }, 'OK'),
      onDismiss,
      width: 'calc(100% - 2rem)'
    }, [
      div({ style: { ...Style.elements.sectionHeader, marginBottom: '1rem' } }, [`Select ${rootEntityType}s to process`]),
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
              checked: type === EntitySelectionType.processAll,
              onChange: () => this.setEntitySelectionModel({ type: EntitySelectionType.processAll, selectedEntities: {} }),
              labelStyle: { marginLeft: '0.75rem' }
            })
          ]),
          hasSet && div([
            h(RadioButton, {
              text: 'Choose an existing set',
              name: 'process-rows',
              checked: type === EntitySelectionType.processFromSet,
              onChange: () => this.setEntitySelectionModel({ type: EntitySelectionType.processFromSet, selectedEntities: {} }),
              labelStyle: { marginLeft: '0.75rem' }
            })
          ]),
          div([
            h(RadioButton, {
              text: 'Choose specific rows to process',
              name: 'process-rows',
              checked: type === EntitySelectionType.chooseRows,
              onChange: () => this.setEntitySelectionModel({ type: EntitySelectionType.chooseRows, selectedEntities: {} }),
              labelStyle: { marginLeft: '0.75rem' }
            })
          ])
        ]),
        type !== EntitySelectionType.processAll && div({
          style: {
            display: 'flex', flexDirection: 'column',
            height: 500, marginTop: '1rem'
          }
        }, [
          h(DataTable, {
            key: type,
            entityType: type === EntitySelectionType.processFromSet ? setType : rootEntityType,
            entityMetadata, workspaceId,
            selectionModel: {
              type: (isSet || type === EntitySelectionType.processFromSet) ? 'single' : 'multiple',
              selected: selectedEntities, setSelected: e => this.setEntitySelectionModel({ selectedEntities: e })
            }
          })
        ]),
        (type === EntitySelectionType.processAll ||
          (type === EntitySelectionType.chooseRows && _.size(selectedEntities) > 1)) && h(IdContainer, [id => div({
          style: { marginTop: '1rem' }
        }, [
          label({ htmlFor: id }, ['Selected rows will be saved as a new set named:']),
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
