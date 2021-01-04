import _ from 'lodash/fp'
import { Fragment, useRef, useState } from 'react'
import { div, h, hr, span } from 'react-hyperscript-helpers'
import ReactJson from 'react-json-view'
import * as breadcrumbs from 'src/components/breadcrumbs'
import Collapse from 'src/components/Collapse'
import { ButtonPrimary, ButtonSecondary, ClipboardButton, Link } from 'src/components/common'
import { centeredSpinner, icon } from 'src/components/icons'
import {
  breadcrumbHistoryCaret,
  callCacheWizardBreadcrumbSubtitle,
  collapseCromwellExecutionStatus, failedIcon, makeSection, makeStatusLine, runningIcon, statusIcon,
  submittedIcon, successIcon, unknownIcon, workflowDetailsBreadcrumbSubtitle
} from 'src/components/job-common'
import Modal from 'src/components/Modal'
import UriViewer from 'src/components/UriViewer'
import WDLViewer from 'src/components/WDLViewer'
import { Ajax } from 'src/libs/ajax'
import { bucketBrowserUrl } from 'src/libs/auth'
import { getConfig } from 'src/libs/config'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'
import { TextInput } from 'src/components/input'
import { codeFont } from 'src/libs/style'


const CallCacheWizard = ({
  onDismiss, namespace, name, submissionId, workflowId, callFqn, attempt, index
}) => {
  /*
   * State setup
   */

  const [otherWorkflowId, setOtherWorkflowId] = useState()
  const signal = Utils.useCancellation()
  const stateRefreshTimer = useRef()

  /*
   * Page render
   */

  const divider = hr({ style: { width: '100%', border: '1px ridge lightgray' } })

  const step1 = () => {
    return h(Fragment, [
      div({ style: { paddingTop: '0.5rem', fontSize: 16, fontWeight: 500, ...Style.noWrapEllipsis } }, ['Step 1: Select a workflow you expected to cache from']),
      div({ style: { marginTop: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'row', alignItems: 'center' } }, [
        div({ style: { paddingRight: '0.5rem' } }, ['Workflow ID:']),
        div({ style: { paddingRight: '0.5rem', flex: '2 1 auto' } }, [h(TextInput, { id: 'otherWorkflowId' })]),
        h(ButtonPrimary, { onClick: () => setOtherWorkflowId(document.getElementById('otherWorkflowId').value) }, ['Continue >'])
      ]),
      divider,
      div({ style: { paddingTop: '0.5rem', fontSize: 16, fontWeight: 500, color: 'lightgray', ...Style.noWrapEllipsis } }, ['Step 2: Select the call you expected to cache from']),
      divider,
      div({ style: { paddingTop: '0.5rem', fontSize: 16, fontWeight: 500, color: 'lightgray', ...Style.noWrapEllipsis } }, ['Result: View cache diff'])
    ])
  }

  const step2 = () => {
    return h(Fragment, [
      div({ style: { display: 'flex', alignItems: 'center', fontSize: 16, fontWeight: 500, ...Style.noWrapEllipsis } }, [
        'Step 1: Selected workflow ID: ',
        div({ style: { marginLeft: '0.5rem', ...Style.codeFont } }, otherWorkflowId),
        h(ButtonSecondary, { style: { paddingLeft: '1rem', height: '20px', color: 'darkred' }, onClick: () => setOtherWorkflowId(undefined) }, ['[X]'])
      ]),
      divider,
      div({ style: { paddingTop: '0.5rem', fontSize: 16, fontWeight: 500, ...Style.noWrapEllipsis } }, ['Step 2: Select which call in that workflow you expected to cache from']),
      divider,
      div({ style: { paddingTop: '0.5rem', fontSize: 16, fontWeight: 500, color: 'lightgray', ...Style.noWrapEllipsis } }, ['Result: View cache diff'])
    ])
  }

  const chooseStep = () => {
    if (!otherWorkflowId) {
      return step1()
    } else {
      return step2()
    }
  }

  return h(Modal, {
    title: 'Call Cache Debugging Wizard',
    onDismiss,
    width: '50%'
  }, [
    div({ style: { padding: '1rem 2rem 2rem', flex: 1, display: 'flex', flexDirection: 'column' } }, [
      'Debuggin cache miss for call:',
      div({ style: { marginTop: '0.5rem', flex: 1, display: 'flex', alignItems: 'center', flexDirection: 'row' } }, [
        div({ style: Style.codeFont }, [workflowId]), breadcrumbHistoryCaret,
        div({ style: Style.codeFont }, [callFqn]),
        Number(index) >= 0 && h(Fragment, [breadcrumbHistoryCaret, 'index', div({ style: { marginLeft: '0.25rem', ...Style.codeFont } }, [index])]),
        Number(attempt) > 1 && h(Fragment, [breadcrumbHistoryCaret, 'attempt', div({ style: { marginLeft: '0.25rem', ...Style.codeFont } }, [attempt])])
      ]),
      divider,
      chooseStep()
    ])
  ])
}

export default CallCacheWizard
