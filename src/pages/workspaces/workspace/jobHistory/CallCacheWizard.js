import _ from 'lodash/fp'
import { Fragment, useRef, useState } from 'react'
import { div, h, hr, span } from 'react-hyperscript-helpers'
import ReactJson from 'react-json-view'
import Select from 'react-select'
import * as breadcrumbs from 'src/components/breadcrumbs'
import Collapse from 'src/components/Collapse'
import { ButtonPrimary, ButtonSecondary, ClipboardButton, Link } from 'src/components/common'
import { centeredSpinner, icon } from 'src/components/icons'
import { TextInput } from 'src/components/input'
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
import { codeFont, noWrapEllipsis } from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const CallCacheWizard = ({
  onDismiss, namespace, name, submissionId, workflowId, callFqn, attempt, index
}) => {
  /*
   * State setup
   */

  const [otherNamespace, setOtherNamespace] = useState(namespace)
  const [otherWorkspaceName, setOtherWorkspaceName] = useState(name)
  const [otherSubmissionId, setOtherSubmissionId] = useState(submissionId)
  const [otherWorkflowId, setOtherWorkflowId] = useState()
  const [otherWorkflowMetadata, setOtherWorkflowMetadata] = useState()
  const [otherCallFqn, setOtherCallFqn] = useState()
  const [otherIndex, setOtherIndex] = useState()
  const [otherAttempt, setOtherAttempt] = useState()

  const signal = Utils.useCancellation()
  const stateRefreshTimer = useRef()

  /*
   * Data Fetchers
   */

  const readCalls = async (otherNs, otherWs, otherSub, otherWf) => {
    const includeKey = [
      'end', 'start', 'executionStatus'
    ]
    const excludeKey = []
    const wf = await Ajax(signal).Workspaces.workspace(otherNs, otherWs).submission(otherSub).getWorkflow(otherWf, includeKey, excludeKey)
    setOtherWorkflowMetadata(wf)
  }

  const callFqnOptions = _.flow(
    _.keys,
    _.map(name => { return { value: name, label: name } })
  )

  /*
   * Page render
   */

  const divider = hr({ style: { width: '100%', border: '1px ridge lightgray' } })

  const step1 = () => {
    return h(Fragment, [
      div({ style: { paddingTop: '0.5rem', fontSize: 16, fontWeight: 500, ...Style.noWrapEllipsis } }, ['Step 1: Select a workflow you expected to cache from']),
      '(Note: Default values are from the current workflow)',
      div({ style: { marginTop: '1rem', display: 'flex', flexDirection: 'row', alignItems: 'center' } }, [
        div({ style: { width: '130px', paddingRight: '0.5rem' } }, ['Namespace:']),
        div({ style: { paddingRight: '0.5rem', flex: '2 1 auto' } }, [h(TextInput, { defaultValue: namespace, style: Style.codeFont, id: 'otherNamespace' })])
      ]),
      div({ style: { marginTop: '0.25rem', display: 'flex', flexDirection: 'row', alignItems: 'center' } }, [
        div({ style: { width: '130px', paddingRight: '0.5rem' } }, ['Workspace:']),
        div({ style: { paddingRight: '0.5rem', flex: '2 1 auto' } }, [h(TextInput, { defaultValue: name, style: Style.codeFont, id: 'otherWorkspaceName' })])
      ]),
      div({ style: { marginTop: '0.25rem', display: 'flex', flexDirection: 'row', alignItems: 'center' } }, [
        div({ style: { width: '130px', paddingRight: '0.5rem' } }, ['Submission ID:']),
        div({ style: { paddingRight: '0.5rem', flex: '2 1 auto' } }, [h(TextInput, { defaultValue: submissionId, style: Style.codeFont, id: 'otherSubmissionId' })])
      ]),
      div({ style: { marginTop: '0.25rem', marginBottom: '1rem', display: 'flex', flexDirection: 'row', alignItems: 'center' } }, [
        div({ style: { width: '130px', paddingRight: '0.5rem' } }, ['Workflow ID:']),
        div({ style: { paddingRight: '0.5rem', flex: '2 1 auto' } }, [h(TextInput, { defaultValue: workflowId, style: Style.codeFont, id: 'otherWorkflowId' })])
      ]),
      div([h(ButtonPrimary, {
        style: { float: 'right' },
        onClick: () => {
          const otherNs = document.getElementById('otherNamespace').value
          const otherWs = document.getElementById('otherWorkspaceName').value
          const otherSub = document.getElementById('otherSubmissionId').value
          const otherWf = document.getElementById('otherWorkflowId').value
          setOtherNamespace(otherNs)
          setOtherWorkspaceName(otherWs)
          setOtherSubmissionId(otherSub)
          setOtherWorkflowId(otherWf)
          readCalls(otherNs, otherWs, otherSub, otherWf)
        }
      }, ['Continue >'])]),
      divider,
      div({ style: { paddingTop: '0.5rem', fontSize: 16, fontWeight: 500, color: 'lightgray', ...Style.noWrapEllipsis } }, ['Step 2: Select the call you expected to cache from']),
      divider,
      div({ style: { paddingTop: '0.5rem', fontSize: 16, fontWeight: 500, color: 'lightgray', ...Style.noWrapEllipsis } }, ['Result: View cache diff'])
    ])
  }

  const step2 = () => {
    const otherCallIndexSelector = (metadata, fqn) => {
      if (!!fqn) {
        const shards = _.flow(
          _.map(c => c.shardIndex),
          _.uniq
        )(metadata.calls[fqn])

        if (shards.length === 1) {
          if (otherIndex !== shards[0]) { setOtherIndex(shards[0]) }
          if (shards[0] === '-1') { return 'N/A (this call was not scattered)' } else { return `${shards[0]} (exactly one shard in the scatter)` }
        } else {
          const shardOptions = _.map(i => { return { value: i, label: i } }).apply(shards)
          return h(Select, { id: 'otherCallIndex', options: shardOptions, onChange: i => setOtherIndex(i) })
        }
      } else {
        return 'Select an FQN first...'
      }
    }

    return h(Fragment, [
      div({ style: { display: 'flex', alignItems: 'center', fontSize: 16, fontWeight: 500 } }, [
        div({ style: { width: '300px' } }, ['Step 1: Selected workflow: ']),
        div({ style: { marginLeft: '0.5rem', ...Style.noWrapEllipsis, ...Style.codeFont } }, otherSubmissionId),
        breadcrumbHistoryCaret,
        div({ style: { marginLeft: '0.5rem', ...Style.noWrapEllipsis, ...Style.codeFont } }, otherWorkflowId),
        h(ButtonSecondary, { style: { paddingLeft: '1rem', height: '20px', color: 'darkred' }, onClick: () => setOtherWorkflowId(undefined) }, ['[X]'])
      ]),
      divider,
      div({ style: { paddingTop: '0.5rem', fontSize: 16, fontWeight: 500, ...Style.noWrapEllipsis } }, ['Step 2: Select which call in that workflow you expected to cache from']),
      otherWorkflowMetadata ? div([
        div({ style: { marginTop: '1rem', display: 'flex', flexDirection: 'row', alignItems: 'center' } }, [
          div({ style: { paddingRight: '0.5rem' } }, ['Call FQN:']),
          div({ style: { paddingRight: '0.5rem', flex: '2 1 auto' } }, [
            h(Select, { id: 'otherCallFqn', options: callFqnOptions(otherWorkflowMetadata.calls), onChange: v => setOtherCallFqn(v.value) })
          ])
        ]),
        div({ style: { marginTop: '0.25rem', marginBottom: '1rem', display: 'flex', flexDirection: 'row', alignItems: 'center' } }, [
          div({ style: { paddingRight: '0.5rem' } }, ['Shard Index:']),
          otherCallFqn ?
            div({ style: { paddingRight: '0.5rem', flex: '2 1 auto' } }, [otherCallIndexSelector(otherWorkflowMetadata, otherCallFqn)]) :
            'Select a call FQN first'
        ]),
        h(ButtonPrimary, { style: { float: 'right' }, onClick: () => setOtherCallFqn(document.getElementById('otherCallFqn').value) }, ['Continue >'])
      ]) : 'Loading other workflow calls...',
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
      'Debugging cache miss for call:',
      div({ style: { marginTop: '0.5rem', flex: 1, display: 'flex', alignItems: 'center', flexDirection: 'row' } }, [
        div({ style: { fontSize: 16, fontWeight: 500, ...Style.codeFont } }, [workflowId]), breadcrumbHistoryCaret,
        div({ style: { fontSize: 16, fontWeight: 500, ...Style.codeFont } }, [callFqn]),
        Number(index) >= 0 && h(Fragment, [breadcrumbHistoryCaret, 'index', div({ style: { marginLeft: '0.25rem', fontSize: 16, fontWeight: 500, ...Style.codeFont } }, [index])]),
        Number(attempt) > 1 && h(Fragment, [breadcrumbHistoryCaret, 'attempt', div({ style: { marginLeft: '0.25rem', fontSize: 16, fontWeight: 500, ...Style.codeFont } }, [attempt])])
      ]),
      divider,
      chooseStep()
    ])
  ])
}

export default CallCacheWizard
