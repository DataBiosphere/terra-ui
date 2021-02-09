import _ from 'lodash/fp'
import { useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import { Link } from 'src/components/common'
import { icon } from 'src/components/icons'
import { makeCromwellStatusLine } from 'src/components/job-common'
import { FlexTable, tableHeight, TooltipCell } from 'src/components/table'
import colors from 'src/libs/colors'
import * as Utils from 'src/libs/utils'
import { FailuresModal } from 'src/pages/workspaces/workspace/jobHistory/FailuresViewer'


const CallTable = ({ namespace, name, submissionId, workflowId, callName, callObjects }) => {
  const [failuresModalParams, setFailuresModalParams] = useState()

  return div([
    h(AutoSizer, { disableHeight: true }, [
      ({ width }) => h(FlexTable, {
        height: tableHeight({ actualRows: callObjects.length, maxRows: 10.5 }), // The half-row here hints at there being extra rows if scrolled
        width: _.max([width, 0]),
        rowCount: callObjects.length,
        noContentMessage: 'No matching calls',
        columns: [
          {
            size: { basis: 100, grow: 0 },
            headerRenderer: () => 'Index',
            cellRenderer: ({ rowIndex }) => {
              const { shardIndex } = callObjects[rowIndex]
              return shardIndex >= 0 ? shardIndex : 'N/A'
            }
          }, {
            size: { basis: 100, grow: 0 },
            headerRenderer: () => 'Attempt',
            cellRenderer: ({ rowIndex }) => {
              const { attempt } = callObjects[rowIndex]
              return attempt
            }
          }, {
            size: { basis: 200, grow: 2 },
            headerRenderer: () => 'Status',
            cellRenderer: ({ rowIndex }) => {
              const { executionStatus } = callObjects[rowIndex]
              return h(TooltipCell, [makeCromwellStatusLine(executionStatus)])
            }
          }, {
            size: { basis: 200, grow: 2 },
            headerRenderer: () => 'Start',
            cellRenderer: ({ rowIndex }) => {
              const { start } = callObjects[rowIndex]
              return h(TooltipCell, [start ? Utils.makeCompleteDate(start) : 'N/A'])
            }
          }, {
            size: { basis: 200, grow: 2 },
            headerRenderer: () => 'End',
            cellRenderer: ({ rowIndex }) => {
              const { end } = callObjects[rowIndex]
              return h(TooltipCell, [end ? Utils.makeCompleteDate(end) : 'N/A'])
            }
          },
          {
            size: { basis: 200, grow: 2 },
            headerRenderer: () => 'Call Caching Result',
            cellRenderer: ({ rowIndex }) => {
              const { callCaching: { effectiveCallCachingMode, result } = {} } = callObjects[rowIndex]
              if (effectiveCallCachingMode === 'ReadAndWriteCache' || effectiveCallCachingMode === 'ReadCache') {
                return result ? h(TooltipCell, [result]) : div({ style: { color: colors.dark(0.7) } }, ['No Information'])
              } else if (effectiveCallCachingMode === 'WriteCache') {
                return div({ style: { color: colors.dark(0.7) } }, ['Written but not read'])
              } else {
                return div({ style: { color: colors.dark(0.7) } }, [effectiveCallCachingMode])
              }
            }
          },
          {
            size: { basis: 200, grow: 2 },
            headerRenderer: () => 'Links',
            cellRenderer: ({ rowIndex }) => {
              const { failures, shardIndex: index, attempt } = callObjects[rowIndex]
              const failureCount = _.size(failures)
              return [
                failures && h(Link, {
                  style: { marginLeft: '0.5rem' },
                  onClick: () => setFailuresModalParams({ index, attempt, failures })
                }, [
                  div({ style: { display: 'flex', alignItems: 'center' } }, [
                    icon('warning-standard', { size: 18, style: { color: colors.warning(), marginRight: '0.5rem' } }),
                    `${failureCount} Message${failureCount > 1 ? 's' : ''}`
                  ])
                ])
              ]
            }
          }
        ]
      })
    ]),
    failuresModalParams && h(FailuresModal, { ...failuresModalParams, callFqn: callName, onDismiss: () => setFailuresModalParams(undefined) })
  ])
}

export default CallTable
