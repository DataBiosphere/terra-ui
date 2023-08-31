import { Fragment, useCallback, useState } from 'react';
import { div, h, h3 } from 'react-hyperscript-helpers';
import { doesWorkspaceSupportCromwellAppForUser, getCurrentApp, getIsAppBusy } from 'src/analysis/utils/app-utils';
import { appToolLabels, appTools } from 'src/analysis/utils/tool-utils';
import Collapse from 'src/components/Collapse';
import { centeredSpinner } from 'src/components/icons';
import { TextCell } from 'src/components/table';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { reportError } from 'src/libs/error';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { notify } from 'src/libs/notifications';
import { useCancellation, useOnMount, usePollingEffect } from 'src/libs/react-utils';
import { AppProxyUrlStatus, workflowsAppStore } from 'src/libs/state';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { getCloudProviderFromWorkspace } from 'src/libs/workspace-utils';
import { WorkflowsAppLauncherCard } from 'src/workflows-app/components/WorkflowsAppLauncherCard';
import { doesAppProxyUrlExist, getCromwellUnsupportedMessage, loadAppUrls } from 'src/workflows-app/utils/app-utils';
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
      // name,
      // namespace,
      workspace,
      workspace: {
        workspace: { workspaceId },
      },
      analysesData: { apps, refreshApps },
    },
    _ref
  ) => {
    // const [methodsData, setMethodsData] = useState();
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    // const [viewFindWorkflowModal, setViewFindWorkflowModal] = useState(false);

    const signal = useCancellation();
    const cbasReady = doesAppProxyUrlExist(workspaceId, 'cbasProxyUrlState');
    const currentApp = getCurrentApp(appToolLabels.CROMWELL, apps);
    const pageReady = cbasReady && currentApp && !getIsAppBusy(currentApp);
    const launcherDisabled = creating || (currentApp && getIsAppBusy(currentApp)) || (currentApp && !pageReady);

    const loadRunsData = useCallback(
      async (cbasProxyUrlDetails) => {
        try {
          if (cbasProxyUrlDetails.status !== AppProxyUrlStatus.Ready) {
            const { cbasProxyUrlState } = await loadAppUrls(workspaceId, 'cbasProxyUrlState');

            if (cbasProxyUrlState.status === AppProxyUrlStatus.Ready) {
              // const runs = await Ajax(signal).Cbas.methods.getWithoutVersions(cbasProxyUrlState.state);
              // setMethodsData(runs.methods);
            }
          } else {
            // const runs = await Ajax(signal).Cbas.methods.getWithoutVersions(cbasProxyUrlDetails.state);
            // setMethodsData(runs.methods);
          }
        } catch (error) {
          notify('error', 'Error loading saved workflows', { detail: error instanceof Response ? await error.text() : error });
        }
      },
      [workspaceId]
    );

    // poll if we're missing CBAS proxy url and stop polling when we have it
    usePollingEffect(() => !doesAppProxyUrlExist(workspaceId, 'cbasProxyUrlState') && loadRunsData(workflowsAppStore.get().cbasProxyUrlState), {
      ms: CbasPollInterval,
      leading: false,
    });

    useOnMount(() => {
      const load = Utils.withBusyState(setLoading, async () => {
        const { cbasProxyUrlState } = await loadAppUrls(workspaceId, 'cbasProxyUrlState');

        if (cbasProxyUrlState.status === AppProxyUrlStatus.Ready) {
          await loadRunsData(cbasProxyUrlState);
          await refreshApps(true);
        }
      });
      load();
    });

    usePollingEffect(
      () => {
        const refresh = async () => await refreshApps(true);
        if (!currentApp || getIsAppBusy(currentApp)) {
          refresh();
        }
      },
      {
        ms: 10000,
        leading: true,
      }
    );

    // const SidebarSeparator = ({ sidebarWidth, setSidebarWidth }) => {
    //   const minWidth = 280;
    //   const getMaxWidth = useCallback(() => _.clamp(minWidth, 1200, window.innerWidth - 200), []);
    //
    //   // eslint-disable-next-line react-hooks/exhaustive-deps
    //   const onDrag = useCallback(
    //     _.throttle(100, (e) => {
    //       setSidebarWidth(_.clamp(minWidth, getMaxWidth(), e.pageX));
    //     }),
    //     [setSidebarWidth]
    //   );
    //
    //   useOnMount(() => {
    //     const onResize = _.throttle(100, () => {
    //       setSidebarWidth(_.clamp(minWidth, getMaxWidth()));
    //     });
    //     window.addEventListener('resize', onResize);
    //     return () => window.removeEventListener('resize', onResize);
    //   });
    //
    //   return h(DraggableCore, { onDrag }, [
    //     h(Interactive, {
    //       tagName: 'div',
    //       role: 'separator',
    //       'aria-label': 'Resize sidebar',
    //       'aria-valuenow': sidebarWidth,
    //       'aria-valuemin': minWidth,
    //       'aria-valuemax': getMaxWidth(),
    //       tabIndex: 0,
    //       className: 'custom-focus-style',
    //       style: {
    //         ...styles.sidebarSeparator,
    //         background: colors.grey(0.4),
    //       },
    //       hover: {
    //         background: colors.accent(1.2),
    //       },
    //       onKeyDown: (e) => {
    //         if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
    //           setSidebarWidth((w) => _.min([w + 10, getMaxWidth()]));
    //         } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
    //           setSidebarWidth((w) => _.max([w - 10, minWidth]));
    //         }
    //       },
    //     }),
    //   ]);
    // };

    const DataTypeSection = ({ title, children }) => {
      return h(
        Collapse,
        {
          role: 'listitem',
          title: h3(
            {
              style: {
                margin: 0,
                fontSize: 16,
                color: colors.dark(),
                textTransform: 'uppercase',
              },
            },
            title
          ),
          titleFirst: true,
          initialOpenState: true,
          summaryStyle: {
            padding: '1.125rem 1.5rem',
            borderBottom: `0.5px solid ${colors.dark(0.2)}`,
            backgroundColor: colors.light(0.4),
            fontSize: 16,
          },
          hover: {
            color: colors.dark(0.9),
          },
        },
        [
          div(
            {
              style: { display: 'flex', flexDirection: 'column', width: '100%' },
              role: 'list',
            },
            [h(TextCell, {}, [children])]
          ),
        ]
      );
    };

    const createWorkflowsApp = Utils.withBusyState(setCreating, async () => {
      try {
        setCreating(true);
        await Ajax(signal).Apps.createAppV2(Utils.generateAppName(), workspace.workspace.workspaceId, appToolLabels.CROMWELL);
        await Ajax(signal).Metrics.captureEvent(Events.applicationCreate, {
          app: appTools.CROMWELL.label,
          ...extractWorkspaceDetails(workspace),
        });
        await refreshApps(true);
      } catch (error) {
        reportError('Cloud Environment Error', error);
      } finally {
        setCreating(false);
      }
    });

    const renderSubmitWorkflow = () => {
      return div({ style: styles.tableContainer }, [
        h(Fragment, [
          div({ style: { ...styles.sidebarContainer, width: 280 } }, [
            div({
              style: {
                display: 'flex',
                padding: '1rem 1.5rem',
                backgroundColor: colors.light(),
                borderBottom: `1px solid ${colors.grey(0.4)}`,
              },
            }),
            div({ style: styles.dataTypeSelectionPanel, role: 'navigation', 'aria-label': 'data in this workspace' }, [
              div({ role: 'list' }, [
                h(DataTypeSection, {}, [
                  div(
                    {
                      style: {
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: '0.5rem 1.5rem',
                        borderBottom: `1px solid ${colors.dark(0.2)}`,
                        backgroundColor: 'white',
                      },
                    },
                    ['Hello']
                  ),
                ]),
              ]),
            ]),
          ]),
        ]),
      ]);

      // div({ style: { margin: '2rem 4rem' } }, [
      //   div({ style: { display: 'flex', marginTop: '1rem', justifyContent: 'space-between' } }, [
      //     h2(['Submit a workflow']),
      //     h(
      //       ButtonOutline,
      //       {
      //         onClick: () =>
      //           Nav.goToPath('workspace-workflows-app-submission-history', {
      //             name,
      //             namespace,
      //           }),
      //       },
      //       ['Submission history']
      //     ),
      //   ]),
      //   div(['Run a workflow in Terra using Cromwell engine. Full feature workflow submission coming soon.']),
      //   !cbasReady && div({ style: { marginTop: '2rem' } }, [icon('loadingSpinner'), ' Loading your Workflows app, this may take a few minutes.']),
      //   cbasReady &&
      //     div({ style: { marginTop: '3rem' } }, [
      //       div({ style: styles.tableContainer }, [
      //         h(Fragment, [
      //           div({ style: { ...styles.sidebarContainer, width: 280 } }, [
      //             div(
      //               {
      //                 style: {
      //                   display: 'flex',
      //                   padding: '1rem 1.5rem',
      //                   backgroundColor: colors.light(),
      //                   borderBottom: `1px solid ${colors.grey(0.4)}`,
      //                 },
      //               },
      //               [h(DataTypeSection, { title: 'Tables' }, [])]
      //             ),
      //           ]),
      //         ]),
      //       ]),
      //       h(SidebarSeparator, {}),
      //       h(
      //         Clickable,
      //         {
      //           'aria-haspopup': 'dialog',
      //           style: {
      //             ...styles.card,
      //             ...styles.shortCard,
      //             color: colors.accent(),
      //             fontSize: 18,
      //             lineHeight: '22px',
      //           },
      //           onClick: () => setViewFindWorkflowModal(true),
      //         },
      //         ['Find a Workflow', icon('plus-circle', { size: 32 })]
      //       ),
      //       h(Fragment, [h(SavedWorkflows, { workspaceName: name, namespace, methodsData })]),
      //     ]),
      //   viewFindWorkflowModal && h(FindWorkflowModal, { name, namespace, workspace, onDismiss: () => setViewFindWorkflowModal(false) }),
      // ]);
    };
    return Utils.cond(
      [loading, () => centeredSpinner()],
      [pageReady, () => renderSubmitWorkflow()],
      [
        doesWorkspaceSupportCromwellAppForUser(workspace.workspace, getCloudProviderFromWorkspace(workspace), appToolLabels.CROMWELL),
        () => h(WorkflowsAppLauncherCard, { onClick: createWorkflowsApp, disabled: launcherDisabled }),
      ],
      [Utils.DEFAULT, () => div({ style: { ...styles.card, width: '50rem', margin: '2rem 4rem' } }, [getCromwellUnsupportedMessage()])]
    );
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
