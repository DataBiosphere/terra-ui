import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { getCurrentApp, getEnvMessageBasedOnStatus } from 'src/analysis/utils/app-utils';
import { getCurrentAppDataDisk } from 'src/analysis/utils/disk-utils';
import { appToolLabels, appTools } from 'src/analysis/utils/tool-utils';
import { ButtonPrimary, spinnerOverlay } from 'src/components/common';
import { withModalDrawer } from 'src/components/ModalDrawer';
import TitleBar from 'src/components/TitleBar';
import { Ajax } from 'src/libs/ajax';
import { withErrorReportingInModal } from 'src/libs/error';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { WORKFLOWS_TAB_AZURE_FEATURE_ID } from 'src/libs/feature-previews-config';
import * as Nav from 'src/libs/nav';
import { useStore, withDisplayName } from 'src/libs/react-utils';
import { azureCookieReadyStore, cookieReadyStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { cloudProviderTypes, getCloudProviderFromWorkspace, isAzureWorkspace } from 'src/libs/workspace-utils';

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
        await Ajax().Apps.createAppV2(Utils.generateAppName(), workspace.workspace.workspaceId, appToolLabels.CROMWELL);
      } else {
        await Ajax()
          .Apps.app(googleProject, Utils.generateAppName())
          .create({
            defaultKubernetesRuntimeConfig,
            diskName: currentDataDisk ? currentDataDisk.name : Utils.generatePersistentDiskName(),
            diskSize: defaultDataDiskSize,
            appType: appTools.CROMWELL.label,
            namespace,
            bucketName,
            workspaceName,
          });
      }

      await Ajax().Metrics.captureEvent(Events.applicationCreate, { app: appTools.CROMWELL.label, ...extractWorkspaceDetails(workspace) });
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
              href: isFeaturePreviewEnabled(WORKFLOWS_TAB_AZURE_FEATURE_ID)
                ? Nav.getLink('workspace-workflows-app', { namespace, name: workspaceName })
                : app?.proxyUrls['cbas-ui'],
              disabled: !cookieReady,
              tooltip: Utils.cond([cookieReady, () => 'Open'], [Utils.DEFAULT, () => 'Please wait until Cromwell is running']),
              onClick: () => {
                onDismiss();
                Ajax().Metrics.captureEvent(Events.applicationLaunch, { app: appTools.CROMWELL.label });
              },
              ...(!isFeaturePreviewEnabled(WORKFLOWS_TAB_AZURE_FEATURE_ID) || cloudProvider === cloudProviderTypes.GCP
                ? Utils.newTabLinkPropsWithReferrer
                : {}),
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
