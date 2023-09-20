import _ from 'lodash/fp';
import { Fragment, useCallback, useState } from 'react';
import { div, h, h2 } from 'react-hyperscript-helpers';
import { AnalysesData } from 'src/analysis/Analyses';
import { getCurrentApp, getIsAppBusy } from 'src/analysis/utils/app-utils';
import { appToolLabels } from 'src/analysis/utils/tool-utils';
import { Clickable } from 'src/components/common';
import { icon } from 'src/components/icons';
import TooltipTrigger from 'src/components/TooltipTrigger';
import { Cbas } from 'src/libs/ajax/workflows-app/Cbas';
import colors from 'src/libs/colors';
import { notify } from 'src/libs/notifications';
import { useCancellation, useOnMount, usePollingEffect } from 'src/libs/react-utils';
import { AppProxyUrlStatus, workflowsAppStore } from 'src/libs/state';
import { withBusyState } from 'src/libs/utils';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';
import { WorkflowCard, WorkflowMethod } from 'src/workflows-app/components/WorkflowCard';
import { FeaturedWorkflow, featuredWorkflowsData } from 'src/workflows-app/fixtures/featured-workflows';
import { doesAppProxyUrlExist, loadAppUrls } from 'src/workflows-app/utils/app-utils';
import { CbasPollInterval } from 'src/workflows-app/utils/submission-utils';

type FeaturedWorkflowsProps = {
  name: string;
  namespace: string;
  workspace: WorkspaceWrapper;
  analysesData: AnalysesData;
};

export const FeaturedWorkflows = ({
  workspace: {
    workspace: { workspaceId },
  },
  analysesData: { apps, refreshApps },
}: FeaturedWorkflowsProps) => {
  const [methodsData, setMethodsData] = useState<WorkflowMethod[]>([]);
  const [loading, setLoading] = useState(true);

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

  const renderFeaturedWorkflows = useCallback(
    () =>
      h(Fragment, [
        div(['Get up and running with these commonly used, standard workflows.']),
        div(
          { style: { marginTop: '1rem' } },
          _.map((method) => {
            const methods = 'methods' in method ? method.methods : [method];
            const methodsInWorkspace = methods.map((featuredMethod) => {
              const matchingMethod = methodsData.find((existingMethod) =>
                existingMethod.method_versions.some((version) => version.url === featuredMethod.method_versions[0].url)
              );
              return [
                matchingMethod !== undefined,
                { ...featuredMethod, last_run: matchingMethod ? matchingMethod.last_run : featuredMethod.last_run },
              ] as const;
            });
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
                  ? div(
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
                    )
                  : div({ style: { display: 'flex', alignItems: 'center', flexDirection: 'row' } }, [
                      !noMethodsInWorkspace &&
                        h(
                          TooltipTrigger,
                          {
                            content:
                              'You already have some of the workflows in this set added to this workspace. Clicking add to workspace will only add the remaining workflows.',
                          },
                          [icon('info-circle', { style: { marginRight: '1rem' }, size: 16, color: colors.accent(1) })]
                        ),
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
                            const imports = methodsInWorkspace.map(([inWorkspace, m]) =>
                              inWorkspace
                                ? Promise.resolve()
                                : Cbas()
                                    .methods.post(state, {
                                      method_name: m.name,
                                      method_description: m.description,
                                      method_source: m.source,
                                      method_version: m.method_versions[0].name,
                                      method_url: m.method_versions[0].url,
                                      method_input_mappings: m.template.method_input_mappings,
                                      method_output_mappings: m.template.method_output_mappings,
                                    })
                                    .catch(async (err) =>
                                      notify('error', 'Error importing workflow', { detail: await err.text() })
                                    )
                            );
                            await Promise.all(imports);
                            // TODO: Import popup...
                          },
                        },

                        ['Add to workspace']
                      ),
                    ]),
              ]
            );
          }, featuredWorkflowsData as FeaturedWorkflow[])
        ),
      ]),
    [methodsData, workspaceId]
  );

  return div({ style: { display: 'flex', flexDirection: 'column', flexGrow: 1, margin: '1rem 2rem' } }, [
    h2({ style: { marginTop: 0 } }, ['Featured workflows']),
    !cbasReady || loading
      ? div({ style: { marginTop: '2rem' } }, [
          icon('loadingSpinner'),
          ' Loading your Workflows app, this may take a few minutes.',
        ])
      : renderFeaturedWorkflows(),
  ]);
};
