import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, h2 } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { ButtonOutline, Clickable } from 'src/components/common'
import { centeredSpinner, icon } from 'src/components/icons'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { isFindWorkflowEnabled } from 'src/libs/config'
import * as Nav from 'src/libs/nav'
import { notify } from 'src/libs/notifications'
import { forwardRefWithName, useCancellation, useOnMount } from 'src/libs/react-utils'
import * as Style from 'src/libs/style'
import { withBusyState } from 'src/libs/utils'
import FindWorkflowModal from 'src/pages/workflows/FindWorkflow/FindWorkflowModal'
import { SavedWorkflows } from 'src/pages/workflows/SavedWorkflows'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const styles = {
  // Card's position: relative and the outer/inner styles are a little hack to fake nested links
  card: {
    ...Style.elements.card.container, position: 'absolute'
  },
  shortCard: {
    width: 300, height: 125, margin: '0 1rem 2rem 0'
  }
}

export const SubmitWorkflow = _.flow(
  forwardRefWithName('SubmitWorkflow'),
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: 'Workflows', activeTab: 'workflows'
  })
)(({ namespace, name, workspace, workspace: { workspace: { createdBy, attributes, workspaceId } }, refreshWorkspace }, ref) => {
  console.log('namespace', namespace) // eslint-disable-line no-console
  console.log('name', name) // eslint-disable-line no-console
  console.log('workspace', workspaceId) // eslint-disable-line no-console
  console.log('workspace', workspace) // eslint-disable-line no-console
  console.log('createdBy', createdBy) // eslint-disable-line no-console
  console.log('attributes', attributes) // eslint-disable-line no-console
  console.log('refreshWorkspace', refreshWorkspace) // eslint-disable-line no-console
  console.log('refreshWorkspace', ref) // eslint-disable-line no-console

  const [methodsData, setMethodsData] = useState()
  const [loading, setLoading] = useState(false)
  const [viewFindWorkflowModal, setViewFindWorkflowModal] = useState(false)

  const signal = useCancellation()

  const refresh = withBusyState(setLoading, async () => {
    const loadRunsData = async () => {
      try {
        // TODO: route this through an argument
        const root = 'https://lzf07312d05014dcfc2a6d8244c0f9b166a3801f44ec2b003d.servicebus.windows.net/wds-eda71001-6619-4a92-bb0a-7741ba650324/cbas'
        const runs = await Ajax(signal).Cbas.methods.getWithoutVersions(root)
        setMethodsData(runs.methods)
      } catch (error) {
        notify('error', 'Error loading saved workflows', { detail: await (error instanceof Response ? error.text() : error) })
      }
    }
    await loadRunsData()
  })

  useOnMount(async () => {
    await refresh()
  })

  return loading ? centeredSpinner() : div([
    div({ style: { margin: '4rem' } }, [
      div({ style: { display: 'flex', marginTop: '1rem', justifyContent: 'space-between' } }, [
        h2(['Submit a workflow']),
        h(ButtonOutline, {
          onClick: () => Nav.goToPath('submission-history')
        }, ['Submission history'])
      ]),
      div(['Run a workflow in Terra using Cromwell engine. Full feature workflow submission coming soon.']),
      div({ style: { marginTop: '3rem' } }, [(h(Clickable, {
        'aria-haspopup': 'dialog',
        disabled: !isFindWorkflowEnabled(),
        style: { ...styles.card, ...styles.shortCard, color: isFindWorkflowEnabled() ? colors.accent() : colors.dark(0.7), fontSize: 18, lineHeight: '22px' },
        onClick: () => setViewFindWorkflowModal(true)
      }, ['Find a Workflow', icon('plus-circle', { size: 32 })])),
      (h(Fragment, [h(SavedWorkflows, { methodsData })]))]),
      viewFindWorkflowModal && h(FindWorkflowModal, { onDismiss: () => setViewFindWorkflowModal(false) })
    ])
  ])
})

export const navPaths = [
  {
    name: 'submit-workflow',
    path: '/workspaces/:namespace/:name/submit-workflow',
    component: SubmitWorkflow,
    public: true
  }
]
