import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { generateAppName, getCurrentApp, getCurrentAppForUser, getEnvMessageBasedOnStatus } from 'src/analysis/utils/app-utils';
import { generatePersistentDiskName, getCurrentAppDataDisk } from 'src/analysis/utils/disk-utils';
import { appAccessScopes, appToolLabels, appTools } from 'src/analysis/utils/tool-utils';
import { ButtonPrimary, spinnerOverlay } from 'src/components/common';
import { withModalDrawer } from 'src/components/ModalDrawer';
import TitleBar from 'src/components/TitleBar';
import { Ajax } from 'src/libs/ajax';
import { withErrorReportingInModal } from 'src/libs/error';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { ENABLE_AZURE_COLLABORATIVE_WORKFLOW_RUNNERS } from 'src/libs/feature-previews-config';
import { withDisplayName } from 'src/libs/react-utils';
import * as Utils from 'src/libs/utils';
import { getCloudProviderFromWorkspace, isAzureWorkspace } from 'src/libs/workspace-utils';
import { cromwellLinkProps, getCromwellUnsupportedMessage } from 'src/workflows-app/utils/app-utils';

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
    appLabel,
    shouldHideCloseButton = true,
  }) => {
    const app = (appLabel === appToolLabels.CROMWELL_RUNNER_APP ? getCurrentAppForUser : getCurrentApp)(appTools[appLabel].label, apps);
    const canCreate = Utils.switchCase(
      appLabel,
      [appToolLabels.CROMWELL, () => true],
      [appToolLabels.CROMWELL_RUNNER_APP, () => isFeaturePreviewEnabled(ENABLE_AZURE_COLLABORATIVE_WORKFLOW_RUNNERS)]
    );
    const appReady = app && app.status === 'RUNNING';
    const [loading, setLoading] = useState(false);
    const currentDataDisk = getCurrentAppDataDisk(appTools[appLabel].label, apps, appDataDisks, workspaceName);
    const cloudProvider = getCloudProviderFromWorkspace(workspace);

    const createCromwell = _.flow(
      Utils.withBusyState(setLoading),
      withErrorReportingInModal('Error creating Cromwell', onError)
    )(async () => {
      if (!canCreate || app) {
        return;
      }
      if (isAzureWorkspace(workspace)) {
        await Ajax().Apps.createAppV2(generateAppName(), workspace.workspace.workspaceId, appLabel, appAccessScopes.USER_PRIVATE);
      } else {
        await Ajax()
          .Apps.app(googleProject, generateAppName())
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

      await Ajax().Metrics.captureEvent(Events.applicationCreate, { app: appLabel, ...extractWorkspaceDetails(workspace) });
      return onSuccess();
    });

    const renderActionButton = () => {
      return !app
        ? h(ButtonPrimary, { disabled: !canCreate, tooltip: !canCreate && getCromwellUnsupportedMessage(), onClick: createCromwell }, ['Create'])
        : h(
            ButtonPrimary,
            {
              ...cromwellLinkProps({
                cloudProvider,
                namespace,
                app,
                name: workspaceName,
              }),
              disabled: !appReady,
              tooltip: Utils.cond([appReady, () => 'Open'], [Utils.DEFAULT, () => 'Please wait until Cromwell is running']),
              onClick: () => {
                onDismiss();
                Ajax().Metrics.captureEvent(Events.applicationLaunch, { app: appTools.CROMWELL.label });
              },
            },
            ['Open workflows tab']
          );
    };

    const renderDefaultCase = () => {
      return div({ style: computeStyles.drawerContent }, [
        h(TitleBar, {
          id: titleId,
          title: `${_.startCase(_.lowerCase(appLabel))} Cloud Environment`,
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
