import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { Clickable, RadioButton } from 'src/components/common'
import DataTable from 'src/components/DataTable'
import { icon } from 'src/components/icons'
import { textInput } from 'src/components/input'
import colors from 'src/libs/colors'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'


const typeOption = ({ name, count, isSelected, selectSelf, unselect }) => div({
  key: name,
  style: {
    display: 'flex', alignItems: 'center',
    fontSize: 16,
    padding: '0.5rem',
    borderBottom: `1px solid ${colors.gray[4]}`
  }
}, [
  isSelected ?
    icon('check-circle', { size: 24, className: 'is-solid', style: { color: colors.blue[0], margin: '-2px 0' } }) :
    h(Clickable, { onClick: selectSelf }, [icon('circle', { size: 20, style: { marginRight: 4 } })]),
  icon('bullet-list', { style: { margin: '0 0.5rem' } }),
  span({ style: { flex: 1 } }, [name]),
  isSelected ?
    h(Clickable, { onClick: unselect }, [icon('times', { size: 24, style: { color: colors.blue[0], margin: '-2px' } })]) :
    `${count} row${count !== 1 ? 's' : ''}`
])


export default class DataStepContent extends Component {
  render() {
    const {
      visible, workspaceId, entityMetadata,
      rootEntityType, setRootEntityType,
      entitySelectionModel: { type, selectedEntities, newSetName },
      setEntitySelectionModel
    } = this.props

    const count = rootEntityType && entityMetadata[rootEntityType].count

    const isSet = _.endsWith('_set', rootEntityType)
    const setType = `${rootEntityType}_set`
    const hasSet = _.has(setType, entityMetadata)

    return div({
      style: {
        display: visible ? 'initial' : 'none'
      }
    }, [
      div({ style: { ...Style.elements.sectionHeader, marginBottom: '1rem' } }, ['Select index file to process']),
      div({ style: { maxWidth: 600 } }, [
        rootEntityType ?
          typeOption({
            name: rootEntityType, isSelected: true,
            unselect: () => setRootEntityType(undefined)
          }) :
          _.map(([name, { count }]) => typeOption({
            name, count,
            isSelected: false,
            selectSelf: () =>  {
              setRootEntityType(name)
            }
          }), _.toPairs(entityMetadata))
      ]),
      rootEntityType && div({
        style: {
          padding: '1rem 0.5rem', lineHeight: '1.5rem'
        }
      }, [
        !isSet && h(Fragment, [
          div([
            h(RadioButton, {
              text: `Process all ${count} rows`,
              checked: type === 'process all',
              onChange: () => setEntitySelectionModel({ type: 'process all' }),
              labelStyle: { marginLeft: '0.75rem' }
            })
          ]),
          hasSet && div([
            h(RadioButton, {
              text: 'Choose an existing set',
              checked: type === 'choose existing',
              onChange: () => setEntitySelectionModel({ type: 'choose existing' }),
              labelStyle: { marginLeft: '0.75rem' }
            })
          ]),
          div([
            h(RadioButton, {
              text: 'Choose specific rows to process',
              checked: type === 'choose rows',
              onChange: () => setEntitySelectionModel({ type: 'choose rows' }),
              labelStyle: { marginLeft: '0.75rem' }
            })
          ]),
          (type === 'process all' || type === 'choose rows') && div([
            span(['Selected rows will be saved as a new table named:']),
            textInput({
              style: { width: 500, marginLeft: '0.25rem' },
              value: newSetName,
              onChange: e => setEntitySelectionModel({ newSetName: e.target.value })
            })
          ])
        ]),
        type !== 'process all' && div({
          style: {
            display: 'flex', flexDirection: 'column',
            height: 500, marginTop: '1rem'
          }
        }, [
          h(DataTable, {
            key: type,
            entityType: type === 'choose existing' ? setType : rootEntityType,
            entityMetadata, workspaceId,
            selectionModel: {
              type: (isSet || type === 'choose existing') ? 'single' : 'multiple',
              selected: selectedEntities, setSelected: e => setEntitySelectionModel({ selectedEntities: e })
            }
          })
        ])
      ])
    ])
  }
}
