import _ from 'lodash/fp';
import { Fragment, useCallback, useState } from 'react';
import { div, h, h2 } from 'react-hyperscript-helpers';
import { AnalysesData } from 'src/analysis/Analyses';
import { getCurrentApp, getIsAppBusy } from 'src/analysis/utils/app-utils';
import { appToolLabels } from 'src/analysis/utils/tool-utils';
import { Clickable } from 'src/components/common';
import { icon } from 'src/components/icons';
import { Cbas } from 'src/libs/ajax/workflows-app/Cbas';
import colors from 'src/libs/colors';
import { notify } from 'src/libs/notifications';
import { useCancellation, useOnMount, usePollingEffect } from 'src/libs/react-utils';
import { AppProxyUrlStatus, workflowsAppStore } from 'src/libs/state';
import { withBusyState } from 'src/libs/utils';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';
import { WorkflowCard, WorkflowCardMethod, WorkflowMethod } from 'src/workflows-app/components/WorkflowCard';
import { doesAppProxyUrlExist, loadAppUrls } from 'src/workflows-app/utils/app-utils';
import { CbasPollInterval } from 'src/workflows-app/utils/submission-utils';

type FeaturedWorkflowsProps = {
  name: string;
  namespace: string;
  workspace: WorkspaceWrapper;
  analysesData: AnalysesData;
};

const featuredWorkflowsData: WorkflowCardMethod[] = [
  {
    name: 'Covid-19 tutorial workflows',
    description:
      'Complete a Covid-19 study tutorial to learn more about workflows in Terra. To learn more, read Covid-19 Surveillance tutorial guide or go to the featured workspace',
    methods: [
      {
        method_id: '00000000-0000-0000-0000-000000000008',
        name: 'fetch_sra_to_bam',
        description: 'fetch_sra_to_bam',
        source: 'Github',
        method_versions: [
          {
            method_version_id: '80000000-0000-0000-0000-000000000008',
            method_id: '00000000-0000-0000-0000-000000000008',
            name: 'v2.1.33.16',
            description: 'fetch_sra_to_bam sample submission',
            url: 'https://raw.githubusercontent.com/broadinstitute/viral-pipelines/v2.1.33.16/pipes/WDL/workflows/fetch_sra_to_bam.wdl',
            last_run: {
              previously_run: false,
            },
          },
        ],
        last_run: {
          previously_run: false,
        },
      },
      {
        method_id: '00000000-0000-0000-0000-000000000005',
        name: 'assemble_refbased',
        description: 'assemble_refbased',
        source: 'Github',
        method_versions: [
          {
            method_version_id: '50000000-0000-0000-0000-000000000005',
            method_id: '00000000-0000-0000-0000-000000000005',
            name: 'v2.1.33.16',
            description: 'assemble_refbased sample submission',
            url: 'https://raw.githubusercontent.com/broadinstitute/viral-pipelines/v2.1.33.16/pipes/WDL/workflows/assemble_refbased.wdl',
            last_run: {
              previously_run: false,
            },
          },
        ],
        last_run: {
          previously_run: false,
        },
      },
      {
        method_id: '00000000-0000-0000-0000-000000000006',
        name: 'sarscov2_nextstrain',
        description: 'sarscov2_nextstrain',
        source: 'Github',
        method_versions: [
          {
            method_version_id: '60000000-0000-0000-0000-000000000006',
            method_id: '00000000-0000-0000-0000-000000000006',
            name: 'v2.1.33.16',
            description: 'sarscov2_nextstrain sample submission',
            url: 'https://raw.githubusercontent.com/broadinstitute/viral-pipelines/v2.1.33.16/pipes/WDL/workflows/sarscov2_nextstrain.wdl',
            last_run: {
              previously_run: false,
            },
          },
        ],
        last_run: {
          previously_run: false,
        },
      },
    ],
  },
];

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
              return [matchingMethod !== undefined, matchingMethod ?? featuredMethod] as const;
            });
            const allMethodsInWorkspace = methodsInWorkspace.every(([inWorkspace, _method]) => inWorkspace);
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
                  : h(
                      Clickable,
                      {
                        onClick: () => {
                          // eslint-disable-next-line no-console
                          console.log(
                            'Importing methods, ',
                            methodsInWorkspace
                              .filter(([inWorkspace, _method]) => inWorkspace)
                              .map(([_inWorkspace, method]) => method)
                          );
                          // TODO: Import methods...
                        },
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
                          ['Add to workspace']
                        ),
                      ]
                    ),
              ]
            );
          }, featuredWorkflowsData)
        ),
      ]),
    [methodsData]
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
