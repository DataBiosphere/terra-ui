import _ from 'lodash/fp';
import { Fragment, ReactElement, useState } from 'react';
import { Component, div, h, hr, img, span } from 'react-hyperscript-helpers';
import { Clickable, spinnerOverlay } from 'src/components/common';
import { icon } from 'src/components/icons';
import ModalDrawer from 'src/components/ModalDrawer';
import TitleBar from 'src/components/TitleBar';
import cromwellImg from 'src/images/cromwell-logo.png';
import galaxyLogo from 'src/images/galaxy-logo.svg';
import hailLogo from 'src/images/hail-logo.svg';
import jupyterLogo from 'src/images/jupyter-logo-long.png';
import rstudioBioLogo from 'src/images/r-bio-logo.svg';
import { Apps } from 'src/libs/ajax/leonardo/Apps';
import { App, appStatuses, LeoAppStatus } from 'src/libs/ajax/leonardo/models/app-models';
import { PersistentDisk } from 'src/libs/ajax/leonardo/models/disk-models';
import { LeoRuntimeStatus, Runtime, runtimeStatuses } from 'src/libs/ajax/leonardo/models/runtime-models';
import { Runtimes } from 'src/libs/ajax/leonardo/Runtimes';
import { Metrics } from 'src/libs/ajax/Metrics';
import colors from 'src/libs/colors';
import { reportError } from 'src/libs/error';
import Events from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import { useCancellation, useStore } from 'src/libs/react-utils';
import { azureCookieReadyStore, cookieReadyStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import {
  AzureWorkspace,
  CloudProvider,
  cloudProviderTypes,
  getCloudProviderFromWorkspace,
  GoogleWorkspace,
} from 'src/libs/workspace-utils';
import { AzureComputeModalBase } from 'src/pages/workspaces/workspace/analysis/modals/AzureComputeModal';
import { ComputeModalBase } from 'src/pages/workspaces/workspace/analysis/modals/ComputeModal';
import { CromwellModalBase } from 'src/pages/workspaces/workspace/analysis/modals/CromwellModal';
import { GalaxyModalBase } from 'src/pages/workspaces/workspace/analysis/modals/GalaxyModal';
import { HailBatchModal } from 'src/pages/workspaces/workspace/analysis/modals/HailBatchModal';
import {
  appLauncherTabName,
  PeriodicAzureCookieSetter,
} from 'src/pages/workspaces/workspace/analysis/runtime-common-components';
import { AppErrorModal, RuntimeErrorModal } from 'src/pages/workspaces/workspace/analysis/RuntimeManager';
import {
  doesWorkspaceSupportCromwellAppForUser,
  getCurrentApp,
  getIsAppBusy,
} from 'src/pages/workspaces/workspace/analysis/utils/app-utils';
import { getCostDisplayForDisk, getCostDisplayForTool } from 'src/pages/workspaces/workspace/analysis/utils/cost-utils';
import {
  getCurrentPersistentDisk,
  getReadyPersistentDisk,
  isCurrentGalaxyDiskDetaching,
} from 'src/pages/workspaces/workspace/analysis/utils/disk-utils';
import {
  getConvertedRuntimeStatus,
  getCurrentRuntime,
  getIsRuntimeBusy,
} from 'src/pages/workspaces/workspace/analysis/utils/runtime-utils';
import {
  appToolLabels,
  appTools,
  getToolsToDisplayForCloudProvider,
  isAppToolLabel,
  isPauseSupported,
  runtimeToolLabels,
  ToolLabel,
  toolLabelDisplays,
  tools,
} from 'src/pages/workspaces/workspace/analysis/utils/tool-utils';

const titleId = 'cloud-env-modal';

export const CloudEnvironmentModal = ({
  isOpen,
  onSuccess,
  onDismiss,
  canCompute,
  runtimes,
  apps,
  appDataDisks,
  refreshRuntimes,
  refreshApps,
  workspace,
  persistentDisks,
  // Note: for Azure environments `location` and `computeRegion` are identical
  location,
  computeRegion,
  workspace: {
    workspace: { namespace, name: workspaceName },
  },
  filterForTool = undefined,
}: {
  isOpen: boolean;
  onSuccess: (string: string) => void;
  onDismiss: () => void;
  canCompute: boolean;
  runtimes: Runtime[];
  apps: App[];
  appDataDisks: PersistentDisk[];
  refreshRuntimes: () => Promise<void>;
  refreshApps: () => Promise<void>;
  workspace: GoogleWorkspace | AzureWorkspace;
  persistentDisks: PersistentDisk[];
  location: string;
  computeRegion: string;
  filterForTool?: string;
}) => {
  const [viewMode, setViewMode] = useState<ToolLabel | undefined>(undefined);
  const [busy, setBusy] = useState<boolean>(false);
  const [errorRuntimeId, setErrorRuntimeId] = useState<number | undefined>(undefined);
  const [errorAppId, setErrorAppId] = useState<string | undefined>(undefined);
  const cloudProvider = getCloudProviderFromWorkspace(workspace);
  const leoCookieReady = useStore(cookieReadyStore);
  const azureCookieReady = useStore(azureCookieReadyStore);
  const currentDisk = getCurrentPersistentDisk(runtimes, persistentDisks);
  const signal = useCancellation();

  const noCompute = 'You do not have access to run analyses on this workspace.';

  const resetView = () => setViewMode(undefined);

  const renderComputeModal = (tool: ToolLabel) =>
    h(ComputeModalBase, {
      // isOpen: viewMode === runtimeToolLabels.Jupyter || viewMode === runtimeToolLabels.RStudio,
      workspace,
      tool,
      currentRuntime,
      currentDisk,
      location,
      onDismiss,
      onSuccess,
      onError: onDismiss,
    });

  const renderAzureModal = (tool: ToolLabel): ReactElement<any> =>
    h(AzureComputeModalBase, {
      isOpen: viewMode === runtimeToolLabels.JupyterLab,
      hideCloseButton: true,
      workspace,
      currentRuntime,
      currentDisk: getReadyPersistentDisk(persistentDisks),
      location,
      tool,
      onDismiss,
      onSuccess,
      onError: onDismiss,
    });

  const renderAppModal = (appModalBase: Component<any>, appMode: ToolLabel | undefined): ReactElement<any> =>
    h(appModalBase, {
      isOpen: viewMode === appMode,
      workspace,
      apps,
      appDataDisks,
      onDismiss,
      onSuccess,
      onError: onDismiss,
    });

  const renderDefaultPage = () =>
    div(
      { style: { display: 'flex', flexDirection: 'column', flex: 1 } },
      filterForTool
        ? [renderToolButtons(tools[filterForTool].label, cloudProvider)]
        : getToolsToDisplayForCloudProvider(cloudProvider).map((tool) => renderToolButtons(tool.label, cloudProvider))
    );

  const toolPanelStyles = {
    backgroundColor: 'white',
    margin: '0 1.5rem 1rem 1.5rem',
    padding: '0 1rem 1rem 1rem',
    display: 'flex',
    flexDirection: 'column' as const,
  };
  const toolLabelStyles = {
    margin: '1rem 0 0.5rem 0',
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
  };
  const toolButtonDivStyles = { display: 'flex', flexDirection: 'row' as const, justifyContent: 'space-evenly' };
  const toolButtonStyles = {
    flex: '1 1 0%',
    maxWidth: 105,
    display: 'flex',
    flexDirection: 'column' as const,
    border: '.5px solid',
    borderColor: colors.grey(),
    borderRadius: 16,
    padding: '.5rem .75rem',
    alignItems: 'center',
    fontWeight: 550,
    fontSize: 11,
    color: colors.accent(),
  };

  const currentRuntime = getCurrentRuntime(runtimes);
  const currentRuntimeStatus = getConvertedRuntimeStatus(currentRuntime);
  const currentRuntimeTool = currentRuntime?.labels?.tool;

  const currentApp = (toolLabel: ToolLabel) => getCurrentApp(toolLabel, apps);

  const isLaunchSupported = (toolLabel: ToolLabel) =>
    Object.values(tools).find((tool) => tool.label === toolLabel)!.isLaunchUnsupported;

  const RuntimeIcon = ({
    shape,
    onClick,
    disabled,
    messageChildren,
    toolLabel,
    tooltip,
    style,
    ...props
  }: {
    shape: string;
    onClick: undefined | (() => any);
    disabled: boolean;
    messageChildren: ReactElement[];
    toolLabel: ToolLabel;
    tooltip?: string;
    style: any;
    props?: any;
  }): ReactElement<any, any> => {
    return h(
      Clickable,
      {
        'aria-label': `${toolLabel} Status`,
        hover: disabled ? {} : { backgroundColor: colors.accent(0.2) },
        // css takes the last thing if there are duplicate fields, the order here is important because all three things can specify color
        style: { ...toolButtonStyles, color: onClick && !disabled ? colors.accent() : colors.dark(0.3), ...style },
        onClick,
        tooltip,
        disabled,
        ...props,
      },
      [icon(shape, { style: { marginBottom: '.25rem' }, size: 20 }), ...messageChildren]
    );
  };

  const executeAndRefresh = async (toolLabel: ToolLabel, promise: Promise<void>) => {
    try {
      setBusy(true);
      await promise;
      (await isAppToolLabel(toolLabel)) ? refreshApps() : refreshRuntimes();
    } catch (error) {
      reportError('Cloud Environment Error', error);
    } finally {
      setBusy(false);
    }
  };

  // TODO: add azure start
  // We assume here that button disabling is working properly, so the only thing to check is whether it's an app or the current (assumed to be existing) runtime
  const startApp = (toolLabel: ToolLabel) => {
    if (isAppToolLabel(toolLabel)) {
      const { appName, cloudContext } = currentApp(toolLabel)!;
      executeAndRefresh(toolLabel, Apps(signal).app(cloudContext.cloudResource, appName).resume());
    } else {
      currentRuntime && executeAndRefresh(toolLabel, Runtimes(signal).runtimeWrapper(currentRuntime).start());
    }
  };

  const stopApp = (toolLabel: ToolLabel) => {
    if (isAppToolLabel(toolLabel)) {
      const { appName, cloudContext } = currentApp(toolLabel)!;
      executeAndRefresh(toolLabel, Apps(signal).app(cloudContext.cloudResource, appName).pause());
    } else {
      currentRuntime && executeAndRefresh(toolLabel, Runtimes(signal).runtimeWrapper(currentRuntime).stop());
    }
  };

  const defaultIcon = (toolLabel: ToolLabel) =>
    isPauseSupported(toolLabel) &&
    h(RuntimeIcon, {
      onClick: () => {},
      shape: 'pause',
      toolLabel,
      disabled: true,
      messageChildren: [span(['Pause'])],
      tooltip: 'No Environment found',
      style: { borderColor: colors.dark(0.3) },
    });

  const renderStatusClickable = (toolLabel: ToolLabel) => {
    if (toolLabel === currentRuntimeTool) {
      return getIconFromStatus(toolLabel, currentRuntimeStatus);
    }
    if (isAppToolLabel(toolLabel)) {
      return getIconFromStatus(toolLabel, currentApp(toolLabel)?.status);
    }
    return defaultIcon(toolLabel);
  };

  const getIconFromStatus = (toolLabel: ToolLabel, status: LeoAppStatus | LeoRuntimeStatus | undefined) => {
    // We dont use Utils.switchCase here to support the 'fallthrough' functionality
    switch (status) {
      case runtimeStatuses.stopped.leoLabel:
      case appStatuses.stopped.status:
        return h(RuntimeIcon, {
          style: {},
          shape: 'play',
          toolLabel,
          onClick: () => startApp(toolLabel),
          disabled: busy || !canCompute,
          messageChildren: [span(['Resume'])],
          tooltip: canCompute ? 'Resume Environment' : noCompute,
        });
      case runtimeStatuses.running.leoLabel:
      case appStatuses.running.status:
        return (
          isPauseSupported(toolLabel) &&
          h(RuntimeIcon, {
            style: {},
            shape: 'pause',
            toolLabel,
            onClick: () => stopApp(toolLabel),
            disabled: busy || !canCompute,
            messageChildren: [span(['Pause'])],
            tooltip: canCompute ? 'Pause Environment' : noCompute,
          })
        );
      case appStatuses.starting.status:
      case appStatuses.stopping.status:
      case appStatuses.provisioning.status:
      case appStatuses.deleting.status:
      case appStatuses.status_unspecified.status:
      case runtimeStatuses.starting.leoLabel:
      case runtimeStatuses.stopping.leoLabel:
      case runtimeStatuses.updating.leoLabel:
      case runtimeStatuses.creating.leoLabel:
        return h(RuntimeIcon, {
          onClick: () => {},
          shape: 'sync',
          toolLabel,
          disabled: true,
          tooltip: 'Environment update in progress',
          messageChildren: [span([_.capitalize(status)])],
          style: { color: colors.dark(0.7) },
        });
      case appStatuses.error.status:
      case runtimeStatuses.error.leoLabel:
        return h(RuntimeIcon, {
          shape: 'warning-standard',
          toolLabel,
          style: { color: colors.danger(0.9) },
          onClick: () => {
            if (isAppToolLabel(toolLabel)) {
              setErrorAppId(currentApp(toolLabel)?.appName);
            } else {
              currentRuntime && setErrorRuntimeId(currentRuntime!.id);
            }
          },
          disabled: busy || !canCompute,
          messageChildren: [span(['View']), span(['Error'])],
          tooltip: canCompute ? 'View error' : noCompute,
        });
      default:
        return defaultIcon(toolLabel);
    }
  };

  const getToolIcon = (toolLabel: ToolLabel) =>
    Utils.switchCase(
      toolLabel,
      [runtimeToolLabels.Jupyter, () => jupyterLogo],
      [appToolLabels.GALAXY, () => galaxyLogo],
      [runtimeToolLabels.RStudio, () => rstudioBioLogo],
      [appToolLabels.CROMWELL, () => cromwellImg],
      [appToolLabels.HAIL_BATCH, () => hailLogo],
      [runtimeToolLabels.JupyterLab, () => jupyterLogo]
    );

  const isCloudEnvModalDisabled = (toolLabel: ToolLabel) => {
    if (isAppToolLabel(toolLabel)) {
      !canCompute ||
        busy ||
        (toolLabel === appToolLabels.GALAXY && isCurrentGalaxyDiskDetaching(apps)) ||
        getIsAppBusy(currentApp(toolLabel));
    } else {
      const runtime = toolLabel === currentRuntimeTool ? currentRuntime : undefined;
      // This asks 'does this tool have a runtime'
      //  if yes, then we allow cloud env modal to open (and ComputeModal determines if it should be read-only mode)
      //  if no, then we want to disallow the cloud env modal opening if the other tool's runtime is busy
      //  this check is not needed if we allow multiple runtimes, and cloud env modal will never be disabled in this case
      return runtime ? false : !canCompute || busy || getIsRuntimeBusy(currentRuntime!);
    }
  };

  const getToolLaunchClickableProps = (toolLabel: ToolLabel, cloudProvider: CloudProvider) => {
    const app = isAppToolLabel(toolLabel) && currentApp(toolLabel);
    const doesCloudEnvForToolExist = currentRuntimeTool === toolLabel || app;
    // TODO what does leoCookieReady do? Found it in the galaxy app launch code, is it needed here?
    const isToolBusy = app
      ? getIsAppBusy(app) || app?.status === 'STOPPED' || app?.status === 'ERROR'
      : currentRuntime?.status === 'Error';

    // This defines whether we have successfully set a LeoToken cookie, used for authenticating to apps.
    // - For Azure, apps run in the domain of the Relay namespace in the landing zone; azureCookieReady stores whether a cookie has been set in that domain
    // - For GCP, apps are all behind a centralized Leo proxy; leoCookieReady stores whether a cookie has been set in Leo's domain.
    const cookieReady = Utils.cond(
      [
        cloudProvider === cloudProviderTypes.AZURE && toolLabel === appToolLabels.CROMWELL,
        () => azureCookieReady.readyForApp,
      ],
      [Utils.DEFAULT, () => leoCookieReady]
    );
    const isDisabled =
      !doesCloudEnvForToolExist ||
      !cookieReady ||
      !canCompute ||
      busy ||
      isToolBusy ||
      !isLaunchSupported(toolLabel) ||
      !doesWorkspaceSupportCromwellAppForUser(workspace.workspace, cloudProvider, toolLabel);
    const baseProps = {
      'aria-label': `Launch ${toolLabel}`,
      disabled: isDisabled,
      style: {
        ...toolButtonStyles,
        color: isDisabled ? colors.dark(0.3) : colors.accent(),
        borderColor: isDisabled ? colors.dark(0.3) : colors.grey(),
      },
      hover: isDisabled ? {} : { backgroundColor: colors.accent(0.2) },
      tooltip: Utils.cond(
        [doesCloudEnvForToolExist && !isDisabled, () => 'Open'],
        [
          isDisabled && !doesWorkspaceSupportCromwellAppForUser(workspace.workspace, cloudProvider, toolLabel),
          () =>
            'Cromwell app is either not supported in this workspace or you need to be a workspace creator to access the app. Please create a new workspace to use Cromwell app.',
        ],
        [
          doesCloudEnvForToolExist && isDisabled && isLaunchSupported(toolLabel),
          () => `Please wait until ${toolLabelDisplays[toolLabel]} is running`,
        ],
        [
          doesCloudEnvForToolExist && isDisabled && !isLaunchSupported(toolLabel),
          () => `Select or create an analysis in the analyses tab to open ${toolLabelDisplays[toolLabel]}`,
        ],
        [Utils.DEFAULT, () => 'No Environment found']
      ),
    };

    return Utils.switchCase(
      toolLabel,
      [
        appToolLabels.GALAXY,
        () => {
          return {
            ...baseProps,
            href: app && app?.proxyUrls?.galaxy,
            onClick: () => {
              onDismiss();
              Metrics(signal).captureEvent(Events.applicationLaunch, { app: 'Galaxy' });
            },
            ...Utils.newTabLinkPropsWithReferrer,
          };
        },
      ],
      [
        appToolLabels.CROMWELL,
        () => {
          return {
            ...baseProps,
            href:
              app &&
              (cloudProvider === cloudProviderTypes.AZURE
                ? app?.proxyUrls['cbas-ui']
                : app?.proxyUrls['cromwell-service']),
            onClick: () => {
              onDismiss();
              Metrics(signal).captureEvent(Events.applicationLaunch, { app: appTools.CROMWELL.label });
            },
            ...Utils.newTabLinkPropsWithReferrer,
          };
        },
      ],
      [
        appToolLabels.HAIL_BATCH,
        () => {
          return {
            ...baseProps,
            href: app && app.proxyUrls?.batch,
            onClick: () => {
              onDismiss();
              Metrics(signal).captureEvent(Events.applicationLaunch, { app: appTools.HAIL_BATCH.label });
            },
            ...Utils.newTabLinkPropsWithReferrer,
          };
        },
      ],
      [
        Utils.DEFAULT,
        () => {
          // TODO: Jupyter link isn't currently valid, and button will always be disabled for Jupyter because launching directly into tree view is problematic in terms of welder/nbextensions. We are investigating alternatives in https://broadworkbench.atlassian.net/browse/IA-2873
          const applicationLaunchLink = Nav.getLink(appLauncherTabName, {
            namespace,
            name: workspaceName,
            application: toolLabel,
          });
          return {
            ...baseProps,
            href: applicationLaunchLink,
            onClick: () => {
              if (
                (toolLabel === runtimeToolLabels.Jupyter || toolLabel === runtimeToolLabels.RStudio) &&
                currentRuntime?.status === 'Stopped'
              ) {
                startApp(toolLabel);
              }
              onDismiss();
            },
          };
        },
      ]
    );
  };

  const renderToolButtons = (toolLabel: ToolLabel, cloudProvider: CloudProvider) => {
    const app = currentApp(toolLabel);
    const doesCloudEnvForToolExist = currentRuntimeTool === toolLabel || app;
    const isCloudEnvForToolDisabled = isCloudEnvModalDisabled(toolLabel);
    return h(Fragment, [
      // We cannot attach the periodic cookie setter until we have a running Cromwell app for Azure because the relay is not guaranteed to be ready until then
      toolLabel === appToolLabels.CROMWELL &&
      app?.cloudContext?.cloudProvider === cloudProviderTypes.AZURE &&
      app?.status === 'RUNNING'
        ? h(PeriodicAzureCookieSetter, {
            proxyUrl: app.proxyUrls['cbas-ui'],
            // forCromwell: true //TODO: this is not yet supported behaviour
          })
        : null,
      div({ style: toolPanelStyles }, [
        // Label at the top for each tool
        div({ style: toolLabelStyles }, [
          img({
            src: getToolIcon(toolLabel),
            style: { height: 30 },
            alt: `${toolLabel}`,
          }),
          div([
            div({ style: { textAlign: 'right' } }, [
              getCostDisplayForTool(app, currentRuntime, currentRuntimeTool, toolLabel),
            ]),
            div({ style: { textAlign: 'right' } }, [
              getCostDisplayForDisk(
                app,
                appDataDisks,
                computeRegion,
                currentRuntimeTool,
                persistentDisks,
                runtimes,
                toolLabel
              ),
            ]),
          ]),
        ]),
        // Cloud environment button
        div({ style: toolButtonDivStyles }, [
          doesWorkspaceSupportCromwellAppForUser(workspace.workspace, cloudProvider, toolLabel) &&
            h(
              Clickable,
              {
                'aria-label': `${toolLabel} Environment`,
                style: {
                  ...toolButtonStyles,
                  color: !isCloudEnvForToolDisabled ? colors.accent() : colors.dark(0.7),
                },
                hover: isCloudEnvForToolDisabled ? {} : { backgroundColor: colors.accent(0.2) },
                tooltip: Utils.cond(
                  [isCloudEnvForToolDisabled, () => 'Edit disabled, processing'],
                  [doesCloudEnvForToolExist, () => 'Edit existing Environment'],
                  [!doesCloudEnvForToolExist, () => 'Create new Environment']
                ),
                disabled: isCloudEnvForToolDisabled,
                onClick: () => setViewMode(toolLabel),
              },
              [icon('cog', { size: 20 }), span({ style: { marginTop: '.25rem' } }, ['Settings'])]
            ),
          // Status button with stop/start functionality
          renderStatusClickable(toolLabel),
          // Launch
          h(Clickable, { ...getToolLaunchClickableProps(toolLabel, cloudProvider) }, [
            icon('rocket', { size: 20 }),
            span({ style: { marginTop: '.25rem' } }, ['Open']),
          ]),
        ]),
      ]),
    ]);
  };

  const getGCPView = () =>
    Utils.switchCase(
      viewMode,
      [runtimeToolLabels.Jupyter, () => renderComputeModal(runtimeToolLabels.Jupyter)],
      [runtimeToolLabels.RStudio, () => renderComputeModal(runtimeToolLabels.RStudio)],
      [appToolLabels.GALAXY, () => renderAppModal(GalaxyModalBase, appToolLabels.GALAXY)],
      [appToolLabels.CROMWELL, () => renderAppModal(CromwellModalBase, appToolLabels.CROMWELL)],
      [appToolLabels.HAIL_BATCH, () => renderAppModal(HailBatchModal, appToolLabels.HAIL_BATCH)],
      [Utils.DEFAULT, renderDefaultPage]
    );

  const getAzureView = () =>
    Utils.switchCase(
      viewMode,
      [runtimeToolLabels.JupyterLab, () => renderAzureModal(runtimeToolLabels.JupyterLab)],
      [appToolLabels.CROMWELL, () => renderAppModal(CromwellModalBase, appToolLabels.CROMWELL)],
      [appToolLabels.HAIL_BATCH, () => renderAppModal(HailBatchModal, appToolLabels.HAIL_BATCH)],
      [Utils.DEFAULT, renderDefaultPage]
    );

  const getView = () =>
    Utils.switchCase(cloudProvider, [cloudProviderTypes.GCP, getGCPView], [cloudProviderTypes.AZURE, getAzureView]);

  const width = Utils.switchCase(
    viewMode,
    [runtimeToolLabels.Jupyter, () => 675],
    [runtimeToolLabels.RStudio, () => 675],
    [appToolLabels.GALAXY, () => 675],
    [appToolLabels.CROMWELL, () => 675],
    [appToolLabels.HAIL_BATCH, () => 675],
    [runtimeToolLabels.JupyterLab, () => 675],
    [Utils.DEFAULT, () => 430]
  );

  const modalBody = h(Fragment, [
    h(TitleBar, {
      id: titleId,
      title: filterForTool ? `${toolLabelDisplays[filterForTool]} Environment Details` : 'Cloud Environment Details',
      titleStyles: _.merge(viewMode === undefined ? {} : { display: 'none' }, { width, margin: '1.5rem 0 .5rem 1rem' }),
      titleChildren: [],
      onDismiss,
      onPrevious: () => (viewMode ? setViewMode(undefined) : undefined),
    }),
    viewMode !== undefined && hr({ style: { borderTop: '1px solid', width: '100%', color: colors.accent() } }),
    getView(),
    errorAppId &&
      h(AppErrorModal, {
        app: _.find({ appName: errorAppId }, apps),
        onDismiss: () => setErrorAppId(undefined),
      }),
    errorRuntimeId &&
      h(RuntimeErrorModal, {
        runtime: _.find({ id: errorRuntimeId }, runtimes),
        onDismiss: () => setErrorRuntimeId(undefined),
      }),
    busy && spinnerOverlay,
  ]);

  const modalProps = {
    'aria-labelledby': titleId,
    isOpen,
    width,
    onDismiss,
    onExited: resetView,
  };
  return h(ModalDrawer, { ...modalProps, children: modalBody });
};
