import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { Clickable, IdContainer, Link } from 'src/components/common'
import { icon } from 'src/components/icons'
import { DelayedAutocompleteTextArea } from 'src/components/input'
import { HeaderCell, SimpleFlexTable, Sortable, TextCell, TooltipCell } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import colors from 'src/libs/colors'
import { HiddenLabel } from 'src/libs/forms'
import * as Utils from 'src/libs/utils'


const cellStyle = optional => ({
  fontWeight: !optional && 500,
  fontStyle: optional && 'italic'
})

const ioTask = ({ name }) => _.nth(-2, name.split('.'))
const ioVariable = ({ name }) => _.nth(-1, name.split('.'))
const ioType = ({ inputType, outputType }) => (inputType || outputType).match(/(.*?)\??$/)[1] // unify, and strip off trailing '?'

const IOTable = ({ which, inputsOutputs: data, config, errors, onChange, onSetDefaults, onBrowse, suggestions, readOnly }) => {
  const [sort, setSort] = useState({ field: 'taskVariable', direction: 'asc' })

  const taskSort = o => ioTask(o).toLowerCase()
  const varSort = o => ioVariable(o).toLowerCase()
  const sortedData = _.orderBy(
    sort.field === 'taskVariable' ? ['optional', taskSort, varSort] : ['optional', varSort, taskSort],
    ['asc', sort.direction, sort.direction],
    data
  )

  return h(SimpleFlexTable, {
    'aria-label': `workflow ${which}`,
    rowCount: sortedData.length,
    noContentMessage: `No matching ${which}.`,
    sort, readOnly,
    columns: [
      {
        size: { basis: 350, grow: 0 },
        field: 'taskVariable',
        headerRenderer: () => h(Sortable, { sort, field: 'taskVariable', onSort: setSort }, [h(HeaderCell, ['Task name'])]),
        cellRenderer: ({ rowIndex }) => {
          const io = sortedData[rowIndex]
          return h(TextCell, { style: { fontWeight: 500 } }, [
            ioTask(io)
          ])
        }
      },
      {
        size: { basis: 360, grow: 0 },
        field: 'workflowVariable',
        headerRenderer: () => h(Sortable, { sort, field: 'workflowVariable', onSort: setSort }, ['Variable']),
        cellRenderer: ({ rowIndex }) => {
          const io = sortedData[rowIndex]
          return h(TextCell, { style: cellStyle(io.optional) }, [ioVariable(io)])
        }
      },
      {
        size: { basis: 160, grow: 0 },
        headerRenderer: () => h(HeaderCell, ['Type']),
        cellRenderer: ({ rowIndex }) => {
          const io = sortedData[rowIndex]
          return h(TextCell, { style: cellStyle(io.optional) }, [ioType(io)])
        }
      },
      {
        headerRenderer: () => h(Fragment, [
          div({ style: { fontWeight: 'bold' } }, ['Attribute']),
          !readOnly && which === 'outputs' && h(Fragment, [
            div({ style: { whiteSpace: 'pre' } }, ['  |  ']),
            h(Link, { onClick: onSetDefaults }, ['Use defaults'])
          ])
        ]),
        cellRenderer: ({ rowIndex }) => {
          const io = sortedData[rowIndex]
          const { name, optional, inputType } = io
          const value = config[which][name] || ''
          const error = errors?.[which][name]
          const isFile = (inputType === 'File') || (inputType === 'File?')
          const formattedValue = JSON.stringify(Utils.maybeParseJSON(value), null, 2)
          return div({ style: { display: 'flex', alignItems: 'center', width: '100%', paddingTop: '0.5rem', paddingBottom: '0.5rem' } }, [
            div({ style: { flex: 1, display: 'flex', position: 'relative', minWidth: 0 } }, [
              !readOnly ? h(IdContainer, [labelId => h(Fragment, [
                h(HiddenLabel, { id: labelId }, [`${ioTask(io)} ${ioVariable(io)} attribute`]),
                h(DelayedAutocompleteTextArea, {
                  autosize: true,
                  spellCheck: false,
                  placeholder: optional ? 'Optional' : 'Required',
                  value,
                  style: isFile ? { paddingRight: '2rem' } : undefined,
                  onChange: v => onChange(name, v),
                  suggestions,
                  labelId
                })
              ])]) : h(TooltipCell, { tooltipDelay: 500, style: { flex: 1 } }, [value]),
              !readOnly && isFile && h(Clickable, {
                style: { position: 'absolute', right: '0.5rem', top: 0, bottom: 0, display: 'flex', alignItems: 'center' },
                onClick: () => onBrowse(name),
                tooltip: 'Browse bucket files',
                'aria-haspopup': 'dialog'
              }, [icon('folder-open', { size: 20 })])
            ]),
            !readOnly && h(Link, {
              style: { marginLeft: '0.25rem' },
              disabled: formattedValue === undefined || formattedValue === value,
              onClick: () => onChange(name, formattedValue),
              tooltip: Utils.cond(
                [formattedValue === undefined, () => 'Cannot format this value'],
                [formattedValue === value, () => 'Already formatted'],
                () => 'Reformat'
              ),
              useTooltipAsLabel: true
            }, ['{…}']),
            error && h(TooltipTrigger, { content: error }, [
              icon('error-standard', {
                size: 14, style: { marginLeft: '0.5rem', color: colors.warning(), cursor: 'help' }
              })
            ])
          ])
        }
      }
    ]
  })
}

export default IOTable
