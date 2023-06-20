import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { WarningTitle } from 'src/analysis/modals/WarningTitle';
import { getCurrentApp, getEnvMessageBasedOnStatus } from 'src/analysis/utils/app-utils';
import { appToolLabels, appTools } from 'src/analysis/utils/tool-utils';
import { ButtonOutline, ButtonPrimary, Link, spinnerOverlay } from 'src/components/common';
import { icon } from 'src/components/icons';
import ModalDrawer from 'src/components/ModalDrawer';
import TitleBar from 'src/components/TitleBar';
import { Apps } from 'src/libs/ajax/leonardo/Apps';
import { App } from 'src/libs/ajax/leonardo/models/app-models';
import { Metrics } from 'src/libs/ajax/Metrics';
import { withErrorReportingInModal } from 'src/libs/error';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { useCancellation, useStore, withDisplayName } from 'src/libs/react-utils';
import { azureCookieReadyStore, cookieReadyStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { BaseWorkspace, cloudProviderTypes, getCloudProviderFromWorkspace } from 'src/libs/workspace-utils';

import { SaveFilesHelpAzure } from '../runtime-common-components';
import { computeStyles } from './modalStyles';

const titleId = 'hail-batch-modal-title';
const deleteWarnMode = Symbol('deleteWarn');

export type HailBatchModalProps = {
  onDismiss: () => void;
  onError: () => void;
  onSuccess: () => void;
  apps: App[];
  workspace: BaseWorkspace;
};

export const HailBatchModal = withDisplayName('HailBatchModal')(
  ({ onDismiss, onError, onSuccess, apps, workspace }: HailBatchModalProps) => {
    const signal = useCancellation();
    const app = getCurrentApp(appTools.HAIL_BATCH.label, apps);
    const workspaceId = workspace.workspace.workspaceId;
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<any>(undefined);
    const leoCookieReady = useStore(cookieReadyStore);
    const azureCookieReady = useStore(azureCookieReadyStore);
    const cloudProvider = getCloudProviderFromWorkspace(workspace);

    // Creates hail batch app in Leo
    const createHailBatch = _.flow(
      Utils.withBusyState(setLoading),
      withErrorReportingInModal('Error creating Hail Batch', onError)
    )(async () => {
      await Apps(signal).createAppV2(Utils.generateAppName(), workspaceId, appToolLabels.HAIL_BATCH);
      Metrics().captureEvent(Events.applicationCreate, {
        app: appTools.CROMWELL.label,
        ...extractWorkspaceDetails(workspace),
      });
      return onSuccess();
    });

    // Deletes hail batch app in Leo
    const deleteHailBatch = _.flow(
      Utils.withBusyState(setLoading),
      withErrorReportingInModal('Error deleting Hail Batch', onError)
    )(async () => {
      if (app) {
        await Apps(signal).deleteAppV2(app.appName, workspaceId);
        Metrics().captureEvent(Events.applicationDelete, {
          app: appTools.HAIL_BATCH.label,
          ...extractWorkspaceDetails(workspace),
        });
      }
      return onSuccess();
    });

    const renderActionButton = () => {
      return !app
        ? h(ButtonPrimary, { onClick: createHailBatch }, ['Create'])
        : Utils.switchCase(
            viewMode,
            [
              deleteWarnMode,
              () => {
                return h(ButtonPrimary, { onClick: deleteHailBatch }, ['Delete']);
              },
            ],
            [
              Utils.DEFAULT,
              () => {
                const cookieReady = Utils.cond(
                  [cloudProvider === cloudProviderTypes.AZURE, () => azureCookieReady.readyForApp],
                  [Utils.DEFAULT, () => leoCookieReady]
                );
                return h(Fragment, [
                  h(
                    ButtonOutline,
                    {
                      disabled: false,
                      style: { marginRight: 'auto' },
                      onClick: () => setViewMode(deleteWarnMode),
                    },
                    ['Delete Environment']
                  ),
                  h(
                    ButtonPrimary,
                    {
                      href: app?.proxyUrls?.batch,
                      disabled: !cookieReady,
                      tooltip: Utils.cond(
                        [cookieReady, () => 'Open'],
                        [Utils.DEFAULT, () => 'Please wait until Hail Batch is running']
                      ),
                      onClick: () => {
                        Metrics().captureEvent(Events.applicationLaunch, { app: appTools.HAIL_BATCH.label });
                      },
                      ...Utils.newTabLinkPropsWithReferrer,
                    },
                    ['Open Hail Batch']
                  ),
                ]);
              },
            ]
          );
    };

    const renderDeleteWarn = () => {
      return div({ style: { ...computeStyles.drawerContent, ...computeStyles.warningView } }, [
        h(TitleBar, {
          id: titleId,
          style: computeStyles.titleBar,
          title: h(WarningTitle, ['Delete environment']),
          onDismiss,
          onPrevious: () => {
            setViewMode(undefined);
          },
          titleChildren: [],
        }),
        div({ style: { lineHeight: '1.5rem' } }, [h(SaveFilesHelpAzure)]),
        div({ style: { display: 'flex', marginTop: '2rem', justifyContent: 'flex-end' } }, [renderActionButton()]),
      ]);
    };

    const renderDefaultCase = () => {
      return div({ style: computeStyles.drawerContent }, [
        h(TitleBar, {
          id: titleId,
          title: 'Hail Batch Cloud Environment',
          style: { marginBottom: '0.5rem' },
          onDismiss,
          onPrevious: () => setViewMode(undefined),
          titleChildren: [],
        }),
        div([getEnvMessageBasedOnStatus(app)]),
        div({ style: { ...computeStyles.whiteBoxContainer, marginTop: '1rem' } }, [
          div([
            div({ style: computeStyles.headerText }, ['Application configuration']),
            div({ style: { marginTop: '0.5rem' } }, ['Hail Batch Service']),
            h(Link, { href: 'https://hail.is/docs/batch/index.html', ...Utils.newTabLinkProps }, [
              'Learn more about Hail Batch',
              icon('pop-out', { size: 12, style: { marginTop: '1rem', marginLeft: '0.25rem' } }),
            ]),
          ]),
        ]),
        div({ style: { display: 'flex', marginTop: '2rem', justifyContent: 'flex-end' } }, [renderActionButton()]),
      ]);
    };

    const renderMessaging = () => {
      return Utils.switchCase(viewMode, [deleteWarnMode, renderDeleteWarn], [Utils.DEFAULT, renderDefaultCase]);
    };

    const modalBody = h(Fragment, [renderMessaging(), loading && spinnerOverlay]);

    const modalProps = {
      isOpen: true,
      width: 675,
      'aria-labelledby': titleId,
      onDismiss,
      onExited: onDismiss,
    };

    return h(ModalDrawer, { ...modalProps, children: modalBody });
  }
);
