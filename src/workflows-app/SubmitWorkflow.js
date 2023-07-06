import { Fragment, useCallback, useState } from 'react';
import { div, h, h2 } from 'react-hyperscript-helpers';
import { ButtonOutline, Clickable } from 'src/components/common';
import { centeredSpinner, icon } from 'src/components/icons';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { isFindWorkflowEnabled } from 'src/libs/config';
import * as Nav from 'src/libs/nav';
import { notify } from 'src/libs/notifications';
import { useCancellation, useOnMount } from 'src/libs/react-utils';
import * as Style from 'src/libs/style';
import { withBusyState } from 'src/libs/utils';
import FindWorkflowModal from 'src/workflows-app/components/FindWorkflowModal';
import { SavedWorkflows } from 'src/workflows-app/components/SavedWorkflows';
import { loadAppUrls } from 'src/workflows-app/components/submission-common';
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

    const refreshAppUrls = useCallback(async () => {
      const {
        wds: { state: wdsUrlRoot },
        cbas: { state: cbasUrlRoot },
      } = await loadAppUrls(workspaceId);

      return { wdsUrlRoot, cbasUrlRoot };
    }, [workspaceId]);

    const loadRunsData = useCallback(async () => {
      const { cbasUrlRoot } = await refreshAppUrls();
      try {
        const runs = await Ajax(signal).Cbas.methods.getWithoutVersions(cbasUrlRoot);
        setMethodsData(runs.methods);
      } catch (error) {
        notify('error', 'Error loading saved workflows', { detail: error instanceof Response ? await error.text() : error });
      }
    }, [refreshAppUrls, signal]);

    const refresh = withBusyState(setLoading, async () => {
      await loadRunsData();
    });

    useOnMount(() => {
      refresh();
    });

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
            div({ style: { marginTop: '3rem' } }, [
              h(
                Clickable,
                {
                  'aria-haspopup': 'dialog',
                  disabled: !isFindWorkflowEnabled(),
                  style: {
                    ...styles.card,
                    ...styles.shortCard,
                    color: isFindWorkflowEnabled() ? colors.accent() : colors.dark(0.7),
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
