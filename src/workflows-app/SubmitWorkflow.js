import { Fragment, useCallback, useState } from 'react';
import { div, h, h2 } from 'react-hyperscript-helpers';
import { doesWorkspaceSupportCromwellAppForUser, getCurrentApp, getIsAppBusy } from 'src/analysis/utils/app-utils';
import { appToolLabels, appTools } from 'src/analysis/utils/tool-utils';
import { ButtonOutline, Clickable } from 'src/components/common';
import { centeredSpinner, icon } from 'src/components/icons';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { reportError } from 'src/libs/error';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { ENABLE_WORKFLOWS_SUBMISSION_UX_REVAMP } from 'src/libs/feature-previews-config';
import * as Nav from 'src/libs/nav';
import { notify } from 'src/libs/notifications';
import { useCancellation, useOnMount, usePollingEffect } from 'src/libs/react-utils';
import { AppProxyUrlStatus, workflowsAppStore } from 'src/libs/state';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { getCloudProviderFromWorkspace } from 'src/libs/workspace-utils';
import FindWorkflowModal from 'src/workflows-app/components/FindWorkflowModal';
import { LeftNavigationPanel } from 'src/workflows-app/components/LeftNavigationPanel';
import { SavedWorkflows } from 'src/workflows-app/components/SavedWorkflows';
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
      name,
      namespace,
      workspace,
      workspace: {
        workspace: { workspaceId },
      },
      analysesData,
      analysesData: { apps, refreshApps },
    },
    _ref
  ) => {
    const [methodsData, setMethodsData] = useState();
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [viewFindWorkflowModal, setViewFindWorkflowModal] = useState(false);

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
              const runs = await Ajax(signal).Cbas.methods.getWithoutVersions(cbasProxyUrlState.state);
              setMethodsData(runs.methods);
            }
          } else {
            const runs = await Ajax(signal).Cbas.methods.getWithoutVersions(cbasProxyUrlDetails.state);
            setMethodsData(runs.methods);
          }
        } catch (error) {
          notify('error', 'Error loading saved workflows', { detail: error instanceof Response ? await error.text() : error });
        }
      },
      [signal, workspaceId]
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
      return !isFeaturePreviewEnabled(ENABLE_WORKFLOWS_SUBMISSION_UX_REVAMP)
        ? div({ style: { margin: '2rem 4rem' } }, [
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
          ])
        : h(LeftNavigationPanel, { name, namespace, workspace, loading, analysesData });
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

//         div(
//           {
//             role: 'main',
//             style: { display: 'flex', flex: 1, height: `calc(100% - ${Style.topBarHeight}px)` },
//           },
//           [
//             div(
//               {
//                 style: {
//                   minWidth: 250,
//                   maxWidth: 275,
//                   boxShadow: '0 2px 5px 0 rgba(0,0,0,0.25)',
//                   overflowY: 'auto',
//                 },
//               },
//               [
//                 _.map(([subHeaderKey, subHeaderName]) => {
//                   const isActive = isSubHeaderActive(subHeaderKey);
//                   return h(
//                     Clickable,
//                     {
//                       'aria-label': `${subHeaderKey}-header-button`,
//                       style: {
//                         /* ...styles.findWorkflowSubHeader(isActive), */ color: isActive ? colors.accent(1.1) : colors.accent(),
//                         fontSize: 16,
//                       },
//                       onClick: () => setSelectedSubHeader(subHeaderKey),
//                       hover: Style.navList.itemHover(isActive),
//                       'aria-current': isActive,
//                       key: subHeaderKey,
//                     },
//                     [subHeaderName]
//                   );
//                 }, Object.entries(subHeadersMap)),
//                 // ]
//                 // ),
//                 h(ListItem, { navLink: 'workspace-workflows-app', title: 'Workflows in this workspace' }),
//                 h(ListItem, { navLink: 'workspace-workflows-app-submission-history', title: 'Submission history' }),
//                 h(
//                   Collapse,
//                   {
//                     title: span({ style: { fontWeight: 'bold', fontSize: 15 } }, ['Find & add workflows']),
//                     initialOpenState: true,
//                     titleFirst: true,
//                     summaryStyle: { padding: '1rem 1rem 1rem 2rem' },
//                   },
//                   [
//                     div({ style: { alignItems: 'center', paddingLeft: '2rem', ...Style.navList.item() }, role: 'list' }, [
//                       _.map((option) => h(ListItem, { key: option.title, navLink: option.navLink, title: option.title }), findAndAdd),
//                     ]),
//                   ]
//                 ),
//                 div(
//                   {
//                     style: { margin: '3em' },
//                     href: `${getConfig().dockstoreUrlRoot}/search?_type=workflow&descriptorType=WDL&searchMode=files`,
//                   },
//                   [
//                     h(
//                       Clickable,
//                       {
//                         style: {
//                           backgroundColor: colors.accent(0.06),
//                           boxShadow: '0 2px 5px 0 rgba(0,0,0,0.35), 0 3px 2px 0 rgba(0,0,0,0.12)',
//                           paddingTop: '0.5em',
//                           paddingBottom: '0.5em',
//                           paddingLeft: '2em',
//                           paddingRight: '0.75em',
//                           borderRadius: '17px',
//                         },
//                       },
//                       [
//                         span({ style: { fontWeight: 'bold' } }, ['Dockstore  ', icon('export')]),
//                         p(['Browse WDL workflows in Dockstore, an open platform used by the GA4GH for sharing Docker-based workflows.']),
//                       ]
//                     ),
//                   ]
//                 ),
//                 h(HelpfulLinksBox, { style: { borderRadius: '17px', width: '75%' } }),
//               ]
//             ),
//           ],
//           div({ style: styles.tableViewPanel }, [
//             _.includes(page),
//             Utils.switchCase(page, [
//               undefined,
//               () => Utils.cond([page === 'submission-history', () => h(SubmissionHistory, { name, namespace, workspace })]),
//             ]),
//           ])
//         )
//       );
//       // div({ style: styles.tableContainer }, [
//       //   h(Fragment, [
//       //     div({ style: { ...styles.sidebarContainer, width: 280 } }, [
//       //       div({
//       //         style: {
//       //           display: 'flex',
//       //           padding: '1rem 1.5rem',
//       //           backgroundColor: colors.light(),
//       //           borderBottom: `1px solid ${colors.grey(0.4)}`,
//       //         },
//       //       }),
//       //       div({ style: styles.dataTypeSelectionPanel, role: 'navigation', 'aria-label': 'data in this workspace' }, [
//       //         div({ role: 'list' }, [
//       //           h(DataTypeSection, {}, [
//       //             div(
//       //               {
//       //                 style: {
//       //                   display: 'flex',
//       //                   flexDirection: 'column',
//       //                   alignItems: 'flex-start',
//       //                   padding: '0.5rem 1.5rem',
//       //                   borderBottom: `1px solid ${colors.dark(0.2)}`,
//       //                   backgroundColor: 'white',
//       //                 },
//       //               },
//       //               ['Workflows in this workspace', 'Submission history', 'Find and add workflows']
//       //             ),
//       //           ]),
//       //         ]),
//       //       ]),
//       //     ]),
//       //   ]),
//       // ]);
//
//       // div({ style: { margin: '2rem 4rem' } }, [
//       //   div({ style: { display: 'flex', marginTop: '1rem', justifyContent: 'space-between' } }, [
//       //     h2(['Submit a workflow']),
//       //     h(
//       //       ButtonOutline,
//       //       {
//       //         onClick: () =>
//       //           Nav.goToPath('workspace-workflows-app-submission-history', {
//       //             name,
//       //             namespace,
//       //           }),
//       //       },
//       //       ['Submission history']
//       //     ),
//       //   ]),
//       //   div(['Run a workflow in Terra using Cromwell engine. Full feature workflow submission coming soon.']),
//       //   !cbasReady && div({ style: { marginTop: '2rem' } }, [icon('loadingSpinner'), ' Loading your Workflows app, this may take a few minutes.']),
//       //   cbasReady &&
//       //     div({ style: { marginTop: '3rem' } }, [
//       //       div({ style: styles.tableContainer }, [
//       //         h(Fragment, [
//       //           div({ style: { ...styles.sidebarContainer, width: 280 } }, [
//       //             div(
//       //               {
//       //                 style: {
//       //                   display: 'flex',
//       //                   padding: '1rem 1.5rem',
//       //                   backgroundColor: colors.light(),
//       //                   borderBottom: `1px solid ${colors.grey(0.4)}`,
//       //                 },
//       //               },
//       //               [h(DataTypeSection, { title: 'Tables' }, [])]
//       //             ),
//       //           ]),
//       //         ]),
//       //       ]),
//       //       h(SidebarSeparator, {}),
//       //       h(
//       //         Clickable,
//       //         {
//       //           'aria-haspopup': 'dialog',
//       //           style: {
//       //             ...styles.card,
//       //             ...styles.shortCard,
//       //             color: colors.accent(),
//       //             fontSize: 18,
//       //             lineHeight: '22px',
//       //           },
//       //           onClick: () => setViewFindWorkflowModal(true),
//       //         },
//       //         ['Find a Workflow', icon('plus-circle', { size: 32 })]
//       //       ),
//       //       h(Fragment, [h(SavedWorkflows, { workspaceName: name, namespace, methodsData })]),
//       //     ]),
//       //   viewFindWorkflowModal && h(FindWorkflowModal, { name, namespace, workspace, onDismiss: () => setViewFindWorkflowModal(false) }),
//       // ]);
//     };
//     return Utils.cond(
//       [loading, () => centeredSpinner()],
//       [pageReady, () => renderSubmitWorkflow()],
//       [
//         doesWorkspaceSupportCromwellAppForUser(workspace.workspace, getCloudProviderFromWorkspace(workspace), appToolLabels.CROMWELL),
//         () => h(WorkflowsAppLauncherCard, { onClick: createWorkflowsApp, disabled: launcherDisabled }),
//       ],
//       [Utils.DEFAULT, () => div({ style: { ...styles.card, width: '50rem', margin: '2rem 4rem' } }, [getCromwellUnsupportedMessage()])]
//     );
//   }
// );

export const navPaths = [
  {
    name: 'workspace-workflows-app',
    path: '/workspaces/:namespace/:name/workflows-app',
    component: SubmitWorkflow,
    title: ({ name }) => `${name} - Workflows`,
  },
];
