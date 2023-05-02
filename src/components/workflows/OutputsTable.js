import _ from 'lodash/fp'
import { h } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import { TextInput } from 'src/components/input'
import { FlexTable, HeaderCell, Sortable, TextCell } from 'src/components/table'
import { parseMethodString } from 'src/components/workflows/submission-common'
import { renderTypeText } from 'src/libs/submission-utils'


const OutputsTable = props => {
  const {
    configuredOutputDefinition, setConfiguredOutputDefinition,
    outputTableSort, setOutputTableSort
  } = props

  const outputTableData = _.flow(
    _.entries,
    _.map(([index, row]) => {
      const { workflow, call, variable } = parseMethodString(row.output_name)
      return _.flow([
        _.set('taskName', call || workflow || ''),
        _.set('variable', variable || ''),
        _.set('outputTypeStr', renderTypeText(row.output_type)),
        _.set('configurationIndex', parseInt(index))
      ])(row)
    }),
    _.orderBy([({ [outputTableSort.field]: field }) => _.lowerCase(field)], [outputTableSort.direction])
  )(configuredOutputDefinition)

  return h(AutoSizer, [({ width, height }) => {
    return h(FlexTable, {
      'aria-label': 'output-table',
      rowCount: outputTableData.length,
      sort: outputTableSort,
      readOnly: false,
      height,
      width,
      columns: [
        {
          size: { basis: 250, grow: 0 },
          field: 'taskName',
          headerRenderer: () => h(Sortable, { sort: outputTableSort, field: 'taskName', onSort: setOutputTableSort }, [h(HeaderCell, ['Task name'])]),
          cellRenderer: ({ rowIndex }) => {
            return h(TextCell, { style: { fontWeight: 500 } }, [outputTableData[rowIndex].taskName])
          }
        },
        {
          size: { basis: 360, grow: 0 },
          field: 'variable',
          headerRenderer: () => h(Sortable, { sort: outputTableSort, field: 'variable', onSort: setOutputTableSort }, [h(HeaderCell, ['Variable'])]),
          cellRenderer: ({ rowIndex }) => {
            return h(TextCell, {}, [outputTableData[rowIndex].variable])
          }
        },
        {
          size: { basis: 160, grow: 0 },
          field: 'outputTypeStr',
          headerRenderer: () => h(HeaderCell, ['Type']),
          cellRenderer: ({ rowIndex }) => {
            return h(TextCell, {}, [outputTableData[rowIndex].outputTypeStr])
          }
        },
        {
          headerRenderer: () => h(HeaderCell, ['Attribute']),
          cellRenderer: ({ rowIndex }) => {
            const outputValue = configurationIndex => {
              const destType = _.get('destination.type', configuredOutputDefinition[configurationIndex])
              if (destType === 'record_update') {
                return _.get('destination.record_attribute', configuredOutputDefinition[configurationIndex])
              }
              return ''
            }

            return h(TextInput, {
              id: `output-parameter-${rowIndex}`,
              style: { display: 'block', width: '100%' },
              value: outputValue(outputTableData[rowIndex].configurationIndex),
              placeholder: '[Enter an attribute name to save this output to your data table]',
              onChange: value => {
                const configurationIndex = outputTableData[rowIndex].configurationIndex
                if (!!value && value !== '') {
                  setConfiguredOutputDefinition(_.set(`${configurationIndex}.destination`, { type: 'record_update', record_attribute: value }, configuredOutputDefinition))
                } else {
                  setConfiguredOutputDefinition(_.set(`${configurationIndex}.destination`, { type: 'none' }, configuredOutputDefinition))
                }
              }
            })
          }
        }
      ]
    })
  }])
}

export default OutputsTable
