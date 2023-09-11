import _ from 'lodash/fp';
import { Fragment, useCallback, useState } from 'react';
import { div, h, h2 } from 'react-hyperscript-helpers';
import { getCurrentApp, getIsAppBusy } from 'src/analysis/utils/app-utils';
import { appToolLabels } from 'src/analysis/utils/tool-utils';
import { icon } from 'src/components/icons';
import { Cbas } from 'src/libs/ajax/workflows-app/Cbas';
import colors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';
import { notify } from 'src/libs/notifications';
import { useCancellation, useOnMount, usePollingEffect } from 'src/libs/react-utils';
import { AppProxyUrlStatus, workflowsAppStore } from 'src/libs/state';
import FindWorkflowModal from 'src/workflows-app/components/FindWorkflowModal';
import { WorkflowCard, WorkflowMethod } from 'src/workflows-app/components/WorkflowCard';
import { doesAppProxyUrlExist, loadAppUrls } from 'src/workflows-app/utils/app-utils';
import { CbasPollInterval } from 'src/workflows-app/utils/submission-utils';

export const WorkflowsInWorkspace = (
  {
    name,
    namespace,
    workspace,
    workspace: {
      workspace: { workspaceId },
    },
    analysesData: { apps, refreshApps },
  },
  _ref
) => {
  const [methodsData, setMethodsData] = useState<WorkflowMethod[]>([]);
  const [viewFindWorkflowModal, setViewFindWorkflowModal] = useState(false);

  const signal = useCancellation();
  const cbasReady = doesAppProxyUrlExist(workspaceId, 'cbasProxyUrlState');
  const currentApp = getCurrentApp(appToolLabels.CROMWELL, apps);

  const loadRunsData = useCallback(
    async (cbasProxyUrlDetails) => {
      try {
        if (cbasProxyUrlDetails.status !== AppProxyUrlStatus.Ready) {
          const { cbasProxyUrlState } = await loadAppUrls(workspaceId, 'cbasProxyUrlState');

          if (cbasProxyUrlState.status === AppProxyUrlStatus.Ready) {
            const runs = await Cbas(signal).methods.getWithVersions(cbasProxyUrlState.state);
            setMethodsData(runs.methods);
          }
        } else {
          const runs = await Cbas(signal).methods.getWithVersions(cbasProxyUrlDetails.state);
          setMethodsData(runs.methods);
        }
      } catch (error) {
        notify('error', 'Error loading saved workflows', {
          detail: error instanceof Response ? await error.text() : error,
        });
      }
    },
    [signal, workspaceId]
  );

  // poll if we're missing CBAS proxy url and stop polling when we have it
  usePollingEffect(
    async () =>
      !doesAppProxyUrlExist(workspaceId, 'cbasProxyUrlState') &&
      loadRunsData(workflowsAppStore.get().cbasProxyUrlState),
    {
      ms: CbasPollInterval,
      leading: false,
    }
  );

  useOnMount(() => {
    const load = async () => {
      const { cbasProxyUrlState } = await loadAppUrls(workspaceId, 'cbasProxyUrlState');

      if (cbasProxyUrlState.status === AppProxyUrlStatus.Ready) {
        await loadRunsData(cbasProxyUrlState);
        await refreshApps(true);
      }
    };
    load();
  });

  usePollingEffect(
    async () => {
      const refresh = async () => await refreshApps(true);
      if (!currentApp || getIsAppBusy(currentApp)) {
        await refresh();
      }
    },
    {
      ms: 10000,
      leading: true,
    }
  );

  return div({ style: { display: 'flex', flexDirection: 'column', flexGrow: 1, margin: '1rem 2rem' } }, [
    h2({ style: { marginTop: 0 } }, ['Workflows in this workspace']),
    !cbasReady
      ? div({ style: { marginTop: '2rem' } }, [
          icon('loadingSpinner'),
          ' Loading your Workflows app, this may take a few minutes.',
        ])
      : methodsData.length === 0
      ? div(
          {
            style: {
              padding: '1rem',
              border: `1px solid ${colors.accent(1)}`,
              borderRadius: 5,
              backgroundColor: colors.accent(0.08),
              width: '75%',
            },
          },
          [
            'Get started: add a workflow to this workspace by using the "Featured workflows" or "Import a workflow" links to the left.',
          ]
        )
      : h(Fragment, [
          div([
            'Workflows in this workspace may be used with invited collaborators and will also be cloned when the workspace is cloned',
          ]),
          div(
            { style: { marginTop: '1rem' } },
            _.map(
              (method) =>
                h(WorkflowCard, {
                  key: method.method_id,
                  method,
                  buttonText: 'Configure',
                  onClick: () =>
                    Nav.goToPath('workspace-workflows-app-submission-config', {
                      namespace,
                      name,
                      methodId: method.method_id,
                    }),
                }),
              methodsData
            )
          ),
        ]),
    viewFindWorkflowModal &&
      h(FindWorkflowModal, { name, namespace, workspace, onDismiss: () => setViewFindWorkflowModal(false) }),
  ]);
};
