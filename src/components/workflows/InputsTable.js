import _ from 'lodash/fp'
import { useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import { FlexTable, HeaderCell, Sortable, TextCell } from 'src/components/table'
import { StructBuilderModal } from 'src/components/workflows/StructBuilder'
import {
  InputSourceSelect,
  ParameterValueTextInput,
  parseMethodString,
  RecordLookupSelect,
  StructBuilderLink,
  WithWarnings
} from 'src/components/workflows/submission-common'
import { inputTypeStyle, isInputOptional, renderTypeText } from 'src/libs/submission-utils'
import * as Utils from 'src/libs/utils'


const InputsTable = props => {
  const {
    selectedDataTable,
    configuredInputDefinition, setConfiguredInputDefinition,
    inputTableSort, setInputTableSort,
    missingRequiredInputs, missingExpectedAttributes, inputsWithInvalidValues
  } = props

  const [structBuilderVisible, setStructBuilderVisible] = useState(false)
  const [structBuilderRow, setStructBuilderRow] = useState(null)

  const dataTableAttributes = _.keyBy('name', selectedDataTable.attributes)

  const inputTableData = _.flow(
    _.entries,
    _.map(([index, row]) => {
      const { workflow, call, variable } = parseMethodString(row.input_name)
      return _.flow([
        _.set('taskName', call || workflow || ''),
        _.set('variable', variable || ''),
        _.set('inputTypeStr', renderTypeText(row.input_type)),
        _.set('configurationIndex', parseInt(index))
      ])(row)
    }),
    _.orderBy([({ [inputTableSort.field]: field }) => _.lowerCase(field)], [inputTableSort.direction])
  )(configuredInputDefinition)

  const recordLookupWithWarnings = (rowIndex, selectedInputName) => {
    const source = _.get(`${inputTableData[rowIndex].configurationIndex}.source`, configuredInputDefinition)
    const setSource = source => {
      setConfiguredInputDefinition(
        _.set(`${inputTableData[rowIndex].configurationIndex}.source`, source, configuredInputDefinition))
    }

    return WithWarnings({
      baseComponent: RecordLookupSelect({
        source,
        setSource,
        dataTableAttributes
      }),
      warningMessage: missingExpectedAttributes.includes(selectedInputName) ? 'This attribute doesn\'t exist in data table' : ''
    })
  }

  const parameterValueSelectWithWarnings = (rowIndex, selectedInputName) => {
    const warningMessage = Utils.cond(
      [missingRequiredInputs.includes(selectedInputName), () => 'This attribute is required'],
      [inputsWithInvalidValues.includes(selectedInputName), () => 'Value is either empty or doesn\'t match expected input type'],
      () => ''
    )

    return WithWarnings({
      baseComponent: ParameterValueTextInput({
        id: `input-table-value-select-${rowIndex}`,
        inputType: _.get('input_type', inputTableData[rowIndex]),
        source: _.get(`${inputTableData[rowIndex].configurationIndex}.source`, configuredInputDefinition),
        setSource: source => {
          setConfiguredInputDefinition(_.set(`${inputTableData[rowIndex].configurationIndex}.source`, source, configuredInputDefinition))
        }
      }),
      warningMessage
    })
  }

  const structBuilderLinkWithWarnings = (rowIndex, selectedInputName) => {
    const warningMessage = missingRequiredInputs.includes(selectedInputName) || missingExpectedAttributes.includes(selectedInputName) || inputsWithInvalidValues.includes(selectedInputName) ? 'One of this struct\'s inputs has an invalid configuration' : ''

    return WithWarnings({
      baseComponent: h(StructBuilderLink, {
        structBuilderVisible,
        onClick: () => {
          setStructBuilderVisible(true)
          setStructBuilderRow(rowIndex)
        }
      }),
      warningMessage
    })
  }

  const sourceNoneWithWarnings = (rowIndex, selectedInputName) => {
    return WithWarnings({
      baseComponent: h(TextCell,
        { style: inputTypeStyle(inputTableData[rowIndex].input_type) },
        [isInputOptional(inputTableData[rowIndex].input_type) ? 'Optional' : 'This input is required']
      ),
      warningMessage: missingRequiredInputs.includes(selectedInputName) ? 'This attribute is required' : ''
    })
  }

  return h(AutoSizer, [({ width, height }) => {
    return h(div, {}, [
      structBuilderVisible && h(StructBuilderModal, {
        structName: _.get('variable', inputTableData[structBuilderRow]),
        structType: _.get('input_type', inputTableData[structBuilderRow]),
        structSource: _.get('source', inputTableData[structBuilderRow]),
        setStructSource: source => setConfiguredInputDefinition(
          _.set(`${inputTableData[structBuilderRow].configurationIndex}.source`, source, configuredInputDefinition)
        ),
        dataTableAttributes,
        onDismiss: () => {
          setStructBuilderVisible(false)
        }
      }),
      h(FlexTable, {
        'aria-label': 'input-table',
        rowCount: inputTableData.length,
        sort: inputTableSort,
        readOnly: false,
        height,
        width,
        columns: [
          {
            size: { basis: 250, grow: 0 },
            field: 'taskName',
            headerRenderer: () => h(Sortable, { sort: inputTableSort, field: 'taskName', onSort: setInputTableSort }, [h(HeaderCell, ['Task name'])]),
            cellRenderer: ({ rowIndex }) => {
              return h(TextCell, { style: { fontWeight: 500 } }, [inputTableData[rowIndex].taskName])
            }
          },
          {
            size: { basis: 360, grow: 0 },
            field: 'variable',
            headerRenderer: () => h(Sortable, { sort: inputTableSort, field: 'variable', onSort: setInputTableSort }, [h(HeaderCell, ['Variable'])]),
            cellRenderer: ({ rowIndex }) => {
              return h(TextCell, { style: inputTypeStyle(inputTableData[rowIndex].input_type) }, [inputTableData[rowIndex].variable])
            }
          },
          {
            size: { basis: 160, grow: 0 },
            field: 'inputTypeStr',
            headerRenderer: () => h(HeaderCell, ['Type']),
            cellRenderer: ({ rowIndex }) => {
              return h(TextCell, { style: inputTypeStyle(inputTableData[rowIndex].input_type) }, [inputTableData[rowIndex].inputTypeStr])
            }
          },
          {
            size: { basis: 350, grow: 0 },
            headerRenderer: () => h(HeaderCell, ['Input sources']),
            cellRenderer: ({ rowIndex }) => {
              return InputSourceSelect({
                source: _.get('source', inputTableData[rowIndex]),
                inputType: _.get('input_type', inputTableData[rowIndex]),
                setSource: source => setConfiguredInputDefinition(
                  _.set(`[${inputTableData[rowIndex].configurationIndex}].source`, source, configuredInputDefinition))
              })
            }
          },
          {
            headerRenderer: () => h(HeaderCell, ['Attribute']),
            cellRenderer: ({ rowIndex }) => {
              const source = _.get(`${rowIndex}.source`, inputTableData)
              const inputName = _.get(`${rowIndex}.input_name`, inputTableData)
              return Utils.switchCase(source.type || 'none',
                ['record_lookup', () => recordLookupWithWarnings(rowIndex, inputName)],
                ['literal', () => parameterValueSelectWithWarnings(rowIndex, inputName)],
                ['object_builder', () => structBuilderLinkWithWarnings(rowIndex, inputName)],
                ['none', () => sourceNoneWithWarnings(rowIndex, inputName)]
              )
            }
          }
        ]
      })
    ])
  }])
}

export default InputsTable
