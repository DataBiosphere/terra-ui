import { useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { doesWorkspaceSupportCromwellAppForUser, generateAppName, getCurrentApp, getIsAppBusy } from 'src/analysis/utils/app-utils';
import { appAccessScopes, appToolLabels, appTools } from 'src/analysis/utils/tool-utils';
import { centeredSpinner } from 'src/components/icons';
import { Ajax } from 'src/libs/ajax';
import { reportError } from 'src/libs/error';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { useCancellation, useOnMount, usePollingEffect } from 'src/libs/react-utils';
import { AppProxyUrlStatus } from 'src/libs/state';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { getCloudProviderFromWorkspace } from 'src/libs/workspace-utils';
import { WorkflowsAppNavPanel } from 'src/workflows-app/components/WorkflowsAppNavPanel';
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
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    const signal = useCancellation();
    const cbasReady = doesAppProxyUrlExist(workspaceId, 'cbasProxyUrlState');
    const currentApp = getCurrentApp(appToolLabels.CROMWELL, apps) || getCurrentApp(appToolLabels.WORKFLOWS_APP, apps);
    const pageReady = cbasReady && currentApp && !getIsAppBusy(currentApp);
    const launcherDisabled = creating || (currentApp && getIsAppBusy(currentApp)) || (currentApp && !pageReady);

    // poll if we're missing CBAS proxy url and stop polling when we have it
    usePollingEffect(() => !doesAppProxyUrlExist(workspaceId, 'cbasProxyUrlState'), {
      ms: CbasPollInterval,
      leading: false,
    });

    useOnMount(() => {
      const load = Utils.withBusyState(setLoading, async () => {
        const { cbasProxyUrlState } = await loadAppUrls(workspaceId, 'cbasProxyUrlState');

        if (cbasProxyUrlState.status === AppProxyUrlStatus.Ready) {
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
        await Ajax().Apps.createAppV2(
          generateAppName(),
          workspace.workspace.workspaceId,
          appToolLabels.WORKFLOWS_APP,
          appAccessScopes.WORKSPACE_SHARED
        );
        await Ajax().Apps.createAppV2(
          generateAppName(),
          workspace.workspace.workspaceId,
          appToolLabels.CROMWELL_RUNNER_APP,
          appAccessScopes.USER_PRIVATE
        );

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
      return h(WorkflowsAppNavPanel, {
        name,
        namespace,
        workspace,
        loading,
        analysesData,
        pageReady,
        launcherDisabled,
        createWorkflowsApp,
        setLoading,
        signal,
      });
    };
    return Utils.cond(
      [loading, () => centeredSpinner()],
      [pageReady, () => renderSubmitWorkflow()],
      [
        doesWorkspaceSupportCromwellAppForUser(workspace.workspace, getCloudProviderFromWorkspace(workspace), appToolLabels.CROMWELL),
        () => h(WorkflowsAppNavPanel, { pageReady, launcherDisabled, loading, createWorkflowsApp }),
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
