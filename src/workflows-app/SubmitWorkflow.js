import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { div, h, h2 } from 'react-hyperscript-helpers';
import { ButtonOutline, Clickable } from 'src/components/common';
import { centeredSpinner, icon } from 'src/components/icons';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';
import { notify } from 'src/libs/notifications';
import { useCancellation, useOnMount } from 'src/libs/react-utils';
import { workflowsAppStore } from 'src/libs/state';
import * as Style from 'src/libs/style';
import { withBusyState } from 'src/libs/utils';
import FindWorkflowModal from 'src/workflows-app/components/FindWorkflowModal';
import { SavedWorkflows } from 'src/workflows-app/components/SavedWorkflows';
import { doesAppProxyUrlExist, loadAppUrls } from 'src/workflows-app/utils/app-utils';
import { CbasPollInterval } from 'src/workflows-app/utils/submission-utils';
import { wrapWorkflowsPage } from 'src/workflows-app/WorkflowsContainer';

const styles = {
  // Card's position: relative and the outer/inner styles are a little hack to fake nested links
  card: {
    ...Style.elements.card.container,
    position: 'absolute',
  },
  shortCard: {
    width: 300,
    height: 125,
    margin: '0 1rem 2rem 0',
  },
};

export const SubmitWorkflow = wrapWorkflowsPage({ name: 'SubmitWorkflow' })(
  (
    {
      name,
      namespace,
      workspace,
      workspace: {
        workspace: { workspaceId },
      },
    },
    _ref
  ) => {
    const [methodsData, setMethodsData] = useState();
    const [loading, setLoading] = useState(false);
    const [viewFindWorkflowModal, setViewFindWorkflowModal] = useState(false);

    const signal = useCancellation();
    const pollCbasInterval = useRef();
    const cbasReady = doesAppProxyUrlExist(workspaceId, 'cbasProxyUrlState');

    const loadRunsData = useCallback(
      async (cbasProxyUrlDetails) => {
        try {
          if (cbasProxyUrlDetails.status !== 'Ready') {
            // console.log('Inside SubmitWorkflow loadRunsData - cbasProxyUrlState is NOT READY');
            const { cbasProxyUrlState } = await loadAppUrls(workspaceId, 'cbasProxyUrlState');

            if (cbasProxyUrlState.status === 'Ready') {
              // console.log('Inside SubmitWorkflow loadRunsData IF of IF - cbasProxyUrlState is READY');
              const runs = await Ajax(signal).Cbas.methods.getWithoutVersions(cbasProxyUrlState.state);
              setMethodsData(runs.methods);
            }
          } else {
            // console.log('Inside SubmitWorkflow loadRunsData - cbasProxyUrlState ALREADY READY');
            const runs = await Ajax(signal).Cbas.methods.getWithoutVersions(cbasProxyUrlDetails.state);
            setMethodsData(runs.methods);
          }
        } catch (error) {
          notify('error', 'Error loading saved workflows', { detail: error instanceof Response ? await error.text() : error });
        }
      },
      [signal, workspaceId]
    );

    useEffect(() => {
      // Start polling if we're missing CBAS proxy url and stop polling when we have it
      if (!cbasReady && !pollCbasInterval.current) {
        pollCbasInterval.current = setInterval(() => loadRunsData(workflowsAppStore.get().cbasProxyUrlState), CbasPollInterval);
      } else if (cbasReady && pollCbasInterval.current) {
        clearInterval(pollCbasInterval.current);
        pollCbasInterval.current = undefined;
      }

      return () => {
        clearInterval(pollCbasInterval.current);
        pollCbasInterval.current = undefined;
      };
    }, [cbasReady, loadRunsData]);

    useOnMount(
      withBusyState(setLoading, async () => {
        // console.log(`Inside SubmitWorkflow useOnMount - current state of workflowsAppStore - ${JSON.stringify(workflowsAppStore.get())}`);
        const { cbasProxyUrlState } = await loadAppUrls(workspaceId, 'cbasProxyUrlState');

        if (cbasProxyUrlState.status === 'Ready') {
          // console.log('Inside SubmitWorkflow cbasProxyUrlState is READY');
          await loadRunsData(cbasProxyUrlState);
        }
      })
    );

    return loading
      ? centeredSpinner()
      : div([
          div({ style: { margin: '2rem 4rem' } }, [
            div({ style: { display: 'flex', marginTop: '1rem', justifyContent: 'space-between' } }, [
              h2(['Submit a workflow']),
              h(
                ButtonOutline,
                {
                  onClick: () =>
                    Nav.goToPath('workspace-workflows-app-submission-history', {
                      name,
                      namespace,
                    }),
                },
                ['Submission history']
              ),
            ]),
            div(['Run a workflow in Terra using Cromwell engine. Full feature workflow submission coming soon.']),
            !cbasReady &&
              div({ style: { marginTop: '2rem' } }, [icon('loadingSpinner'), ' Loading your Workflows app, this may take a few minutes.']),
            cbasReady &&
              div({ style: { marginTop: '3rem' } }, [
                h(
                  Clickable,
                  {
                    'aria-haspopup': 'dialog',
                    style: {
                      ...styles.card,
                      ...styles.shortCard,
                      color: colors.accent(),
                      fontSize: 18,
                      lineHeight: '22px',
                    },
                    onClick: () => setViewFindWorkflowModal(true),
                  },
                  ['Find a Workflow', icon('plus-circle', { size: 32 })]
                ),
                h(Fragment, [h(SavedWorkflows, { workspaceName: name, namespace, methodsData })]),
              ]),
            viewFindWorkflowModal && h(FindWorkflowModal, { name, namespace, workspace, onDismiss: () => setViewFindWorkflowModal(false) }),
          ]),
        ]);
  }
);

export const navPaths = [
  {
    name: 'workspace-workflows-app',
    path: '/workspaces/:namespace/:name/workflows-app',
    component: SubmitWorkflow,
    title: ({ name }) => `${name} - Workflows`,
  },
];
