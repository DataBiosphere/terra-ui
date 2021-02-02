import _ from 'lodash/fp'
import { useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import { icon } from 'src/components/icons'
import { makeCromwellStatusLine } from 'src/components/job-common'
import { FlexTable, TooltipCell } from 'src/components/table'
import colors from 'src/libs/colors'
import * as Utils from 'src/libs/utils'
import FailuresModal from 'src/pages/workspaces/workspace/jobHistory/FailuresModal'


const CallTable = ({ namespace, name, submissionId, workflowId, callName, callObjects }) => {
  const [failuresModalParams, setFailuresModalParams] = useState()

  return div([
    h(FlexTable, {
      height: _.min([callObjects.length * 100, 600]),
      width: _.max([window.screen.width - 200, 0]),
      rowCount: callObjects.length,
      noContentMessage: 'No matching workflows',
      columns: [
        {
          size: { basis: 100, grow: 0 },
          headerRenderer: () => 'Index',
          cellRenderer: ({ rowIndex }) => {
            const { shardIndex } = callObjects[rowIndex]
            return h(TooltipCell, [shardIndex >= 0 ? shardIndex : 'N/A'])
          }
        }, {
          size: { basis: 100, grow: 0 },
          headerRenderer: () => 'Attempt',
          cellRenderer: ({ rowIndex }) => {
            const { attempt } = callObjects[rowIndex]
            return h(TooltipCell, [attempt])
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
                onClick: () => setFailuresModalParams({ callFqn: callName, index, attempt, failures })
              }, [
                div({ style: { display: 'flex', alignItems: 'center' } }, [
                  icon('warning-standard', { size: 18, style: { color: colors.warning(), marginRight: '0.5rem' } }),
                  `${failureCount} Error Message${failureCount > 1 ? 's' : ''}`
                ])
              ])
            ]
          }
        }
      ]
    }),
    failuresModalParams && h(FailuresModal, { ...failuresModalParams, onDismiss: () => setFailuresModalParams(undefined) })
  ])
}

export default CallTable
