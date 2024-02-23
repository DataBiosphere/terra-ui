import { TooltipTrigger } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { Dispatch, Fragment, SetStateAction, useCallback, useState } from 'react';
import { div, h, h2 } from 'react-hyperscript-helpers';
import { AnalysesData } from 'src/analysis/Analyses';
import { getCurrentApp, getIsAppBusy } from 'src/analysis/utils/app-utils';
import { appToolLabels } from 'src/analysis/utils/tool-utils';
import { Clickable } from 'src/components/common';
import { icon } from 'src/components/icons';
import { useMetricsEvent } from 'src/libs/ajax/metrics/useMetrics';
import { Cbas } from 'src/libs/ajax/workflows-app/Cbas';
import colors from 'src/libs/colors';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { notify } from 'src/libs/notifications';
import { useCancellation, useOnMount, usePollingEffect } from 'src/libs/react-utils';
import { AppProxyUrlStatus, workflowsAppStore } from 'src/libs/state';
import { withBusyState } from 'src/libs/utils';
import { ImportWorkflowModal } from 'src/workflows-app/components/ImportWorkflowModal';
import { WorkflowCard, WorkflowMethod } from 'src/workflows-app/components/WorkflowCard';
import { FeaturedWorkflow, featuredWorkflowsData } from 'src/workflows-app/fixtures/featured-workflows';
import { doesAppProxyUrlExist, loadAppUrls, loadingYourWorkflowsApp } from 'src/workflows-app/utils/app-utils';
import { CbasPollInterval } from 'src/workflows-app/utils/submission-utils';
import { WorkspaceWrapper } from 'src/workspaces/utils';

type FeaturedWorkflowsProps = {
  name: string;
  namespace: string;
  workspace: WorkspaceWrapper;
  analysesData: AnalysesData;
  setSelectedSubHeader: Dispatch<SetStateAction<string>>;
};

export const FeaturedWorkflows = ({
  name,
  namespace,
  workspace,
  workspace: {
    workspace: { workspaceId },
  },
  analysesData: { apps, refreshApps },
  setSelectedSubHeader,
}: FeaturedWorkflowsProps) => {
  const [methodsData, setMethodsData] = useState<WorkflowMethod[]>([]);
  const [loading, setLoading] = useState(true);

  const [methodName, setMethodName] = useState('');
  const [methodId, setMethodId] = useState('');

  const [importWorkflowModal, setImportWorkflowModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [successfulImport, setSuccessfulImport] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState('');

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
  const { captureEvent } = useMetricsEvent();
  const getMethodsInWorkspace = useCallback(
    (method) => {
      const methods = 'methods' in method ? method.methods : [method];
      return methods.map((featuredMethod) => {
        const matchingMethod = methodsData.find((existingMethod) =>
          existingMethod.method_versions.some((version) => version.url === featuredMethod.method_versions[0].url)
        );
        return [
          matchingMethod !== undefined,
          { ...featuredMethod, last_run: matchingMethod ? matchingMethod.last_run : featuredMethod.last_run },
        ] as const;
      });
    },
    [methodsData]
  );

  const addedButton = () =>
    div(
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2,
          color: colors.light(0.5),
          fontWeight: 500,
          padding: '0.75rem 0',
          whiteSpace: 'pre',
          backgroundColor: colors.success(1),
        },
      },
      [icon('success-standard'), '   Added']
    );

  const addToWorkspaceButton = useCallback(
    (method, methodsInWorkspace) =>
      h(
        Clickable,
        {
          style: {
            flex: 1,
            borderRadius: 2,
            color: colors.light(0.5),
            fontWeight: 500,
            textAlign: 'center',
            padding: '0.75rem 0',
            minWidth: '10rem',
            backgroundColor: colors.accent(1),
          },
          onClick: async () => {
            const {
              cbasProxyUrlState: { state },
            } = await loadAppUrls(workspaceId, 'cbasProxyUrlState');
            const importMethod = (state, method) => {
              captureEvent(
                Events.workflowsAppImport,
                {
                  ...extractWorkspaceDetails(workspace),
                  workflowSource: method.source,
                  workflowName: method.name,
                  workflowUrl: method.method_versions[0].url,
                  importPage: 'FeaturedWorkflows',
                },
                false
              );

              return Cbas().methods.post(state, {
                method_name: method.name,
                method_description: method.description,
                method_source: method.source,
                method_version: method.method_versions[0].name,
                method_url: method.method_versions[0].url,
                method_input_mappings: method.template?.method_input_mappings,
                method_output_mappings: method.template?.method_output_mappings,
              });
            };
            setImportWorkflowModal(true);
            setImportLoading(true);
            setMethodName(method.name);
            const imports = methodsInWorkspace.map(([inWorkspace, m]) =>
              inWorkspace ? Promise.resolve() : importMethod(state, m)
            );
            await Promise.all(imports)
              .then((resolvedImports) => {
                setSuccessfulImport(true);
                loadRunsData(state);
                setMethodId(resolvedImports[0].method_id);
              })
              .catch(async (error) => {
                setSuccessfulImport(false);
                setErrorMessage(JSON.stringify(error instanceof Response ? await error.text() : error, null, 2));
              });
            setImportLoading(false);
          },
        },
        ['Add to workspace']
      ),
    [loadRunsData, workspaceId, captureEvent, workspace]
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

  const renderFeaturedWorkflows = () =>
    h(Fragment, [
      div(['Get up and running with these commonly used, standard workflows.']),
      div(
        { style: { marginTop: '1rem' } },
        _.map((method) => {
          const methodsInWorkspace = getMethodsInWorkspace(method);
          const allMethodsInWorkspace = methodsInWorkspace.every(([inWorkspace, _method]) => inWorkspace);
          const noMethodsInWorkspace = methodsInWorkspace.every(([inWorkspace, _method]) => !inWorkspace);
          const newMethodData = methodsInWorkspace.map(([_inWorkspace, method]) => method);
          return h(
            WorkflowCard,
            {
              key: method.name,
              method: 'methods' in method ? { ...method, methods: newMethodData } : newMethodData[0],
            },
            [
              allMethodsInWorkspace
                ? addedButton()
                : div({ style: { display: 'flex', alignItems: 'center', flexDirection: 'row' } }, [
                    !noMethodsInWorkspace &&
                      h(
                        TooltipTrigger,
                        {
                          useTooltipAsLabel: true,
                          content:
                            'You already have some of the workflows in this set added to this workspace. Clicking add to workspace will only add the remaining workflows.',
                        },
                        [icon('info-circle', { style: { marginRight: '1rem' }, size: 16, color: colors.accent(1) })]
                      ),
                    addToWorkspaceButton(method, methodsInWorkspace),
                  ]),
            ]
          );
        }, featuredWorkflowsData as FeaturedWorkflow[])
      ),
    ]);

  return div({ style: { display: 'flex', flexDirection: 'column', flexGrow: 1, margin: '1rem 2rem' } }, [
    h2({ style: { marginTop: 0 } }, ['Featured workflows']),
    !cbasReady || loading ? loadingYourWorkflowsApp() : renderFeaturedWorkflows(),
    importWorkflowModal &&
      h(ImportWorkflowModal, {
        importLoading,
        methodName,
        onDismiss: () => {
          setImportWorkflowModal(false);
          window.Appcues?.page();
        },
        workspace,
        namespace,
        name,
        methodId,
        setSelectedSubHeader,
        successfulImport,
        errorMessage,
      }),
  ]);
};
