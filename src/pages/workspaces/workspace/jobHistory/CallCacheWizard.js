import _ from 'lodash/fp'
import { Fragment, useRef, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import ReactJson from 'react-json-view'
import * as breadcrumbs from 'src/components/breadcrumbs'
import Collapse from 'src/components/Collapse'
import { ClipboardButton, Link } from 'src/components/common'
import { centeredSpinner, icon } from 'src/components/icons'
import {
  callCacheWizardBreadcrumbSubtitle,
  collapseCromwellExecutionStatus, failedIcon, makeSection, makeStatusLine, runningIcon, statusIcon,
  submittedIcon, successIcon, unknownIcon, workflowDetailsBreadcrumbSubtitle
} from 'src/components/job-common'
import UriViewer from 'src/components/UriViewer'
import WDLViewer from 'src/components/WDLViewer'
import { Ajax } from 'src/libs/ajax'
import { bucketBrowserUrl } from 'src/libs/auth'
import { getConfig } from 'src/libs/config'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'

const CallCacheWizard = _.flow(
  Utils.forwardRefWithName('CallCacheWizard'),
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: 'Job History', activeTab: 'job history'
  })
)((props, ref) => {
  const { namespace, name, submissionId, workflowId, workspace: { workspace: { bucketName } } } = props

  /*
   * State setup
   */
  const [workflow, setWorkflow] = useState()
  const [showLog, setShowLog] = useState(false)

  const signal = Utils.useCancellation()
  const stateRefreshTimer = useRef()

  /*
   * Data fetchers
   */

  Utils.useOnMount(() => {
    const loadWorkflow = async () => {
      const initialQueryIncludeKey = [
        'end', 'start', 'status', 'workflowName'
      ]
      const wf = await Ajax(signal).Workspaces.workspace(namespace, name).submission(submissionId).getWorkflow(workflowId, initialQueryIncludeKey)
      setWorkflow(wf)

      if (_.includes(wf.status, ['Running', 'Submitted'])) {
        stateRefreshTimer.current = setTimeout(loadWorkflow, 60000)
      }
    }

    loadWorkflow()
    return () => {
      clearTimeout(stateRefreshTimer.current)
    }
  })

  /*
   * Page render
   */
  const { end, start, status, workflowName, calls } = workflow || {}

  return div({ style: { padding: '1rem 2rem 2rem', flex: 1, display: 'flex', flexDirection: 'column' } }, [
    callCacheWizardBreadcrumbSubtitle(namespace, name, submissionId, workflowId),
    workflow === undefined ? centeredSpinner() : div({ style: { display: 'flex', flexWrap: 'wrap' } }, [
      makeSection('Workflow Status', [
        div({ style: { lineHeight: '24px' } }, [makeStatusLine(style => statusIcon(status, style), status)])
      ])
    ])
  ])
})

export const navPaths = [
  {
    name: 'workspace-call-cache-wizard',
    path: '/workspaces/:namespace/:name/job_history/:submissionId/:workflowId/call_cache_wizard',
    component: CallCacheWizard,
    title: ({ name }) => `${name} - Call Cache Wizard`
  }
]
