import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { generateAppName, getCurrentApp, getEnvMessageBasedOnStatus } from 'src/analysis/utils/app-utils';
import { generatePersistentDiskName, getCurrentAppDataDisk } from 'src/analysis/utils/disk-utils';
import { appAccessScopes, appToolLabels, appTools } from 'src/analysis/utils/tool-utils';
import { ButtonPrimary, spinnerOverlay } from 'src/components/common';
import { withModalDrawer } from 'src/components/ModalDrawer';
import TitleBar from 'src/components/TitleBar';
import { Apps } from 'src/libs/ajax/leonardo/Apps';
import { Metrics } from 'src/libs/ajax/Metrics';
import { withErrorReportingInModal } from 'src/libs/error';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { useStore, withDisplayName } from 'src/libs/react-utils';
import { azureCookieReadyStore, cookieReadyStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { cromwellLinkProps } from 'src/workflows-app/utils/app-utils';
import { cloudProviderTypes, getCloudProviderFromWorkspace, isAzureWorkspace } from 'src/workspaces/utils';

import { computeStyles } from './modalStyles';

const defaultDataDiskSize = 500; // GB
const defaultKubernetesRuntimeConfig = { machineType: 'n1-highmem-8', numNodes: 1, autoscalingEnabled: false };

const titleId = 'cromwell-modal-title';

// TODO: As this code continues to evolve, create a shared base class with GalaxyModalBase if possible
// (or find another way to reduce code duplication).
export const CromwellModalBase = withDisplayName('CromwellModal')(
  ({
    onDismiss,
    onError,
    onSuccess,
    apps,
    appDataDisks,
    workspace,
    workspace: {
      workspace: { namespace, bucketName, name: workspaceName, googleProject },
    },
    shouldHideCloseButton = true,
  }) => {
    const app = getCurrentApp(appTools.CROMWELL.label, apps);
    const [loading, setLoading] = useState(false);
    const currentDataDisk = getCurrentAppDataDisk(appTools.CROMWELL.label, apps, appDataDisks, workspaceName);
    const leoCookieReady = useStore(cookieReadyStore);
    const azureCookieReady = useStore(azureCookieReadyStore);
    const cloudProvider = getCloudProviderFromWorkspace(workspace);

    const createCromwell = _.flow(
      Utils.withBusyState(setLoading),
      withErrorReportingInModal('Error creating Cromwell', onError)
    )(async () => {
      if (isAzureWorkspace(workspace)) {
        await Apps().createAppV2(generateAppName(), workspace.workspace.workspaceId, appToolLabels.WORKFLOWS_APP, appAccessScopes.WORKSPACE_SHARED);
        await Apps().createAppV2(generateAppName(), workspace.workspace.workspaceId, appToolLabels.CROMWELL_RUNNER_APP, appAccessScopes.USER_PRIVATE);
      } else {
        await Apps()
          .app(googleProject, generateAppName())
          .create({
            defaultKubernetesRuntimeConfig,
            diskName: currentDataDisk ? currentDataDisk.name : generatePersistentDiskName(),
            diskSize: defaultDataDiskSize,
            appType: appTools.CROMWELL.label,
            namespace,
            bucketName,
            workspaceName,
          });
      }

      await Metrics().captureEvent(Events.applicationCreate, { app: appTools.CROMWELL.label, ...extractWorkspaceDetails(workspace) });
      return onSuccess();
    });

    const renderActionButton = () => {
      const cookieReady = Utils.cond(
        [cloudProvider === cloudProviderTypes.AZURE, () => azureCookieReady.readyForApp],
        [Utils.DEFAULT, () => leoCookieReady]
      );
      return !app
        ? h(ButtonPrimary, { onClick: createCromwell }, ['Create'])
        : h(
            ButtonPrimary,
            {
              ...cromwellLinkProps({
                cloudProvider,
                namespace,
                app,
                name: workspaceName,
              }),
              disabled: !cookieReady,
              tooltip: Utils.cond([cookieReady, () => 'Open'], [Utils.DEFAULT, () => 'Please wait until Cromwell is running']),
              onClick: () => {
                onDismiss();
                Metrics().captureEvent(Events.applicationLaunch, { app: appTools.CROMWELL.label });
              },
            },
            ['Open Cromwell']
          );
    };

    const renderDefaultCase = () => {
      return div({ style: computeStyles.drawerContent }, [
        h(TitleBar, {
          id: titleId,
          title: 'Cromwell Cloud Environment',
          hideCloseButton: shouldHideCloseButton,
          style: { marginBottom: '0.5rem' },
          onDismiss,
          onPrevious: undefined,
        }),
        div([getEnvMessageBasedOnStatus(app)]),
        div({ style: { display: 'flex', marginTop: '2rem', justifyContent: 'flex-end' } }, [renderActionButton()]),
      ]);
    };
    return h(Fragment, [renderDefaultCase(), loading && spinnerOverlay]);
  }
);

export const CromwellModal = withModalDrawer({ width: 675, 'aria-labelledby': titleId })(CromwellModalBase);
