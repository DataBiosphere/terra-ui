import _ from 'lodash/fp';
import { Fragment, useCallback, useState } from 'react';
import { div, h, h2 } from 'react-hyperscript-helpers';
import { AnalysesData } from 'src/analysis/Analyses';
import { getCurrentApp, getIsAppBusy } from 'src/analysis/utils/app-utils';
import { appToolLabels } from 'src/analysis/utils/tool-utils';
import { ButtonSecondary, Clickable, DeleteConfirmationModal } from 'src/components/common';
import { makeMenuIcon } from 'src/components/PopupTrigger';
import { Cbas } from 'src/libs/ajax/workflows-app/Cbas';
import colors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';
import { notify } from 'src/libs/notifications';
import { useCancellation, useOnMount, usePollingEffect } from 'src/libs/react-utils';
import { AppProxyUrlStatus, workflowsAppStore } from 'src/libs/state';
import { withBusyState } from 'src/libs/utils';
import { WorkflowCard, WorkflowMethod } from 'src/workflows-app/components/WorkflowCard';
import { doesAppProxyUrlExist, loadAppUrls, loadingYourWorkflowsApp } from 'src/workflows-app/utils/app-utils';
import { CbasPollInterval } from 'src/workflows-app/utils/submission-utils';
import { canWrite, WorkspaceWrapper } from 'src/workspaces/utils';

type WorkflowsInWorkspaceProps = {
  name: string;
  namespace: string;
  workspace: WorkspaceWrapper;
  analysesData: AnalysesData;
};

export const WorkflowsInWorkspace = ({
  name,
  namespace,
  workspace: {
    workspace: { workspaceId },
    accessLevel,
  },
  analysesData: { apps, refreshApps },
}: WorkflowsInWorkspaceProps) => {
  const [methodsData, setMethodsData] = useState<WorkflowMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [methodToDelete, setMethodToDelete] = useState<WorkflowMethod | null>(null);
  const [cbasBuildInfo, setCbasBuildInfo] = useState(null);

  const signal = useCancellation();
  const cbasReady = doesAppProxyUrlExist(workspaceId, 'cbasProxyUrlState');
  const currentApp = getCurrentApp(appToolLabels.WORKFLOWS_APP, apps);

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

  const loadCbasInfo = useCallback(
    async (cbasProxyUrlDetails) => {
      try {
        const { build } = await Cbas(signal).info(cbasProxyUrlDetails.state);
        setCbasBuildInfo(build);
      } catch (error) {
        notify('error', 'Error loading CBAS build information', {
          detail: error instanceof Response ? await error.text() : error,
        });
      }
    },
    [signal]
  );

  const deleteMethod = useCallback(
    async (methodId) => {
      const { cbasProxyUrlState } = await loadAppUrls(workspaceId, 'cbasProxyUrlState');
      await Cbas(signal).methods.archive(cbasProxyUrlState.state, methodId);
      await loadRunsData(cbasProxyUrlState);
      setMethodToDelete(null);
    },
    [signal, loadRunsData, workspaceId]
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
    const load = withBusyState(setLoading, async () => {
      const { cbasProxyUrlState } = await loadAppUrls(workspaceId, 'cbasProxyUrlState');

      if (cbasProxyUrlState.status === AppProxyUrlStatus.Ready) {
        await loadRunsData(cbasProxyUrlState);
        await loadCbasInfo(cbasProxyUrlState);
        await refreshApps();
      }
    });
    load();
  });

  usePollingEffect(
    async () => {
      const refresh = async () => await refreshApps();
      if (!currentApp || getIsAppBusy(currentApp)) {
        await refresh();
      }
    },
    {
      ms: 10000,
      leading: true,
    }
  );

  const renderMethods = useCallback(
    () =>
      methodsData.length === 0
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
            ['Get started: add a workflow to this workspace by using the "Find & add workflows" dropdown to the left.']
          )
        : h(Fragment, [
            div([
              'Workflows in this workspace may be used with invited collaborators and will also be cloned when the workspace is cloned',
            ]),
            div(
              { style: { marginTop: '1rem' } },
              _.map(
                (method) =>
                  h(
                    WorkflowCard,
                    {
                      key: method.method_id,
                      method,
                    },
                    [
                      h(
                        Clickable,
                        {
                          onClick: () =>
                            Nav.goToPath('workspace-workflows-app-submission-config', {
                              namespace,
                              name,
                              methodId: method.method_id,
                            }),
                        },
                        [
                          div(
                            {
                              style: {
                                borderRadius: 2,
                                color: colors.light(0.5),
                                fontWeight: 500,
                                textAlign: 'center',
                                padding: '0.75rem 0',
                                backgroundColor: colors.accent(1),
                              },
                            },
                            ['Configure']
                          ),
                        ]
                      ),
                      div(
                        {
                          style: {
                            display: 'flex',
                            flexDirection: 'column',
                            marginTop: '30%',
                          },
                        },
                        [
                          // we're gating the delete button behind cbasBuildInfo
                          // because we know that buildInfo will become available before the new delete endpoint.
                          cbasBuildInfo &&
                            h(
                              ButtonSecondary,
                              {
                                onClick: () => setMethodToDelete(method),
                                disabled: !canWrite(accessLevel),
                                tooltip: !canWrite(accessLevel)
                                  ? 'You must have write permission to delete workflows in this workspace'
                                  : '',
                                style: {
                                  justifyContent: 'flex-end',
                                },
                              },
                              [makeMenuIcon('trash'), 'Delete']
                            ),
                        ]
                      ),
                    ]
                  ),
                methodsData
              )
            ),
            methodToDelete &&
              h(DeleteConfirmationModal, {
                objectType: 'workflow',
                objectName: methodToDelete.name,
                onDismiss: () => setMethodToDelete(null),
                onConfirm: () => deleteMethod(methodToDelete.method_id),
              }),
          ]),
    [name, namespace, accessLevel, methodsData, deleteMethod, methodToDelete, cbasBuildInfo]
  );

  return div({ style: { display: 'flex', flexDirection: 'column', flexGrow: 1, margin: '1rem 2rem' } }, [
    h2({ style: { marginTop: 0 } }, ['Workflows in this workspace']),
    !cbasReady || loading ? loadingYourWorkflowsApp() : renderMethods(),
  ]);
};
