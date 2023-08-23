import _ from 'lodash/fp';
import { Fragment, useEffect, useState } from 'react';
import { div, h, h2, p, span, strong } from 'react-hyperscript-helpers';
import { SaveFilesHelp, SaveFilesHelpAzure, SaveFilesHelpGalaxy } from 'src/analysis/runtime-common-components';
import { AppErrorModal, RuntimeErrorModal } from 'src/analysis/RuntimeManager';
import { getDiskAppType } from 'src/analysis/utils/app-utils';
import {
  getAppCost,
  getGalaxyComputeCost,
  getPersistentDiskCostMonthly,
  getRuntimeCost,
} from 'src/analysis/utils/cost-utils';
import { mapToPdTypes, workspaceHasMultipleDisks } from 'src/analysis/utils/disk-utils';
import {
  getCreatorForCompute,
  getDisplayStatus,
  isComputePausable,
  isResourceDeletable,
} from 'src/analysis/utils/resource-utils';
import {
  defaultComputeZone,
  getDisplayRuntimeStatus,
  getNormalizedComputeRegion,
  getRegionFromZone,
  isGcpContext,
} from 'src/analysis/utils/runtime-utils';
import { AppToolLabel, appTools, getToolLabelFromCloudEnv, isPauseSupported } from 'src/analysis/utils/tool-utils';
import { Clickable, LabeledCheckbox, Link, spinnerOverlay } from 'src/components/common';
import { icon } from 'src/components/icons';
import Modal from 'src/components/Modal';
import PopupTrigger, { makeMenuIcon } from 'src/components/PopupTrigger';
import SupportRequestWrapper from 'src/components/SupportRequest';
import { SimpleFlexTable, Sortable } from 'src/components/table';
import TooltipTrigger from 'src/components/TooltipTrigger';
import { useWorkspaces } from 'src/components/workspace-utils';
import { useReplaceableAjaxExperimental } from 'src/libs/ajax';
import { App, isApp } from 'src/libs/ajax/leonardo/models/app-models';
import { DecoratedPersistentDisk } from 'src/libs/ajax/leonardo/models/disk-models';
import { isGceConfig, isGceWithPdConfig } from 'src/libs/ajax/leonardo/models/runtime-config-models';
import { isRuntime, Runtime } from 'src/libs/ajax/leonardo/models/runtime-models';
import colors from 'src/libs/colors';
import { withErrorIgnoring, withErrorReporting, withErrorReportingInModal } from 'src/libs/error';
import Events from 'src/libs/events';
import { useCancellation, useGetter } from 'src/libs/react-utils';
import { contactUsActive, getUser } from 'src/libs/state';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { isGoogleWorkspaceInfo, WorkspaceInfo } from 'src/libs/workspace-utils';

const DeleteRuntimeModal = ({
  runtime: { cloudContext, googleProject, runtimeName, runtimeConfig },
  workspaceId,
  onDismiss,
  onSuccess,
}) => {
  const [deleteDisk, setDeleteDisk] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const ajax = useReplaceableAjaxExperimental();
  const deleteRuntime = _.flow(
    Utils.withBusyState(setDeleting),
    withErrorReporting('Error deleting cloud environment')
  )(async () => {
    isGcpContext(cloudContext)
      ? await ajax().Runtimes.runtime(googleProject, runtimeName).delete(deleteDisk)
      : await ajax().Runtimes.runtimeV2(workspaceId, runtimeName).delete(deleteDisk);
    onSuccess();
  });

  return h(
    Modal,
    {
      title: 'Delete cloud environment?',
      onDismiss,
      okButton: deleteRuntime,
    },
    [
      div({ style: { lineHeight: 1.5 } }, [
        runtimeConfig.persistentDiskId
          ? h(LabeledCheckbox, { checked: deleteDisk, onChange: setDeleteDisk }, [
              span({ style: { fontWeight: 600 } }, [' Also delete the persistent disk and all files on it']),
            ])
          : p([
              'Deleting this cloud environment will also ',
              span({ style: { fontWeight: 600 } }, ['delete any files on the associated hard disk.']),
            ]),
        p([
          'Deleting your cloud environment will stop all running notebooks and associated costs. You can recreate your cloud environment later, ',
          'which will take several minutes.',
        ]),
        !isGcpContext(cloudContext) ? h(SaveFilesHelpAzure) : h(SaveFilesHelp),
      ]),
      deleting && spinnerOverlay,
    ]
  );
};

const DeleteDiskModal = ({ disk: { cloudContext, googleProject, name, id }, isGalaxyDisk, onDismiss, onSuccess }) => {
  const [busy, setBusy] = useState(false);
  const ajax = useReplaceableAjaxExperimental();

  const deleteDisk = _.flow(
    Utils.withBusyState(setBusy),
    withErrorReporting('Error deleting persistent disk')
  )(async () => {
    isGcpContext(cloudContext)
      ? await ajax().Disks.disksV1().disk(googleProject, name).delete()
      : await ajax().Disks.disksV2().delete(id);

    onSuccess();
  });
  return h(
    Modal,
    {
      title: 'Delete persistent disk?',
      onDismiss,
      okButton: deleteDisk,
    },
    [
      p(['Deleting the persistent disk will ', span({ style: { fontWeight: 600 } }, ['delete all files on it.'])]),
      isGalaxyDisk && h(SaveFilesHelp),
      busy && spinnerOverlay,
    ]
  );
};

interface DeleteAppModalProps {
  app: App;
  onDismiss: () => void;
  onSuccess: () => void;
}

const DeleteAppModal = ({ app, onDismiss, onSuccess }: DeleteAppModalProps) => {
  const [deleteDisk, setDeleteDisk] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const {
    appName,
    appType,
    cloudContext: { cloudProvider, cloudResource },
  } = app;
  const ajax = useReplaceableAjaxExperimental();
  const deleteApp = _.flow(
    Utils.withBusyState(setDeleting),
    withErrorReportingInModal('Error deleting cloud environment', onDismiss)
  )(async () => {
    // TODO: this should use types in IA-3824
    if (cloudProvider === 'GCP') {
      await ajax().Apps.app(cloudResource, appName).delete(deleteDisk);
      onSuccess();
    } else {
      throw new Error('Deleting apps is currently only supported on GCP');
    }
  });
  return h(
    Modal,
    {
      title: 'Delete cloud environment?',
      onDismiss,
      okButton: deleteApp,
    },
    [
      div({ style: { lineHeight: 1.5 } }, [
        app.diskName
          ? h(LabeledCheckbox, { checked: deleteDisk, onChange: setDeleteDisk }, [
              span({ style: { fontWeight: 600 } }, [' Also delete the persistent disk and all files on it']),
            ])
          : p([
              'Deleting this cloud environment will also ',
              span({ style: { fontWeight: 600 } }, ['delete any files on the associated hard disk.']),
            ]),
        appType === appTools.GALAXY.label && h(SaveFilesHelpGalaxy),
      ]),
      deleting && spinnerOverlay,
    ]
  );
};

// These are for calling attention to resources that are most likely linked to GCP v1 workspaces.
// Rawls will no longer return v1 workspaces, but Leo does not have a way to filter out disks/cloud environments related to them.
const unsupportedDiskMessage =
  'This disk is not associated with a supported workspace. It is recommended that you delete it to avoid additional cloud costs.';
const unsupportedCloudEnvironmentMessage =
  'This cloud environment is not associated with a supported workspace. It is recommended that you delete it to avoid additional cloud costs.';
const UnsupportedWorkspaceCell = ({ status, message }) =>
  div(
    {
      style: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        // margin/padding set to force the background color to fill the entire cell. SimpleFlexTable does
        // not provide a way to override the styling at the cell level.
        height: '100%',
        margin: '-1rem',
        paddingLeft: '1rem',
        backgroundColor: colors.danger(0.15),
        justifyContent: 'center',
      },
    },
    [
      h(TooltipTrigger, { content: message }, [
        div({ 'aria-label': message }, [
          `${status}`,
          icon('warning-standard', { style: { marginLeft: '0.25rem', color: colors.danger() } }),
        ]),
      ]),
    ]
  );

interface PauseButtonProps {
  cloudEnvironment: App | Runtime;
  currentUser: string;
  pauseComputeAndRefresh: any;
}

export function PauseButton({ cloudEnvironment, currentUser, pauseComputeAndRefresh }: PauseButtonProps) {
  const shouldShowPauseButton =
    isPauseSupported(getToolLabelFromCloudEnv(cloudEnvironment)) &&
    currentUser === getCreatorForCompute(cloudEnvironment);

  return shouldShowPauseButton
    ? h(
        Link,
        {
          style: { marginRight: '1rem' },
          disabled: !isComputePausable(cloudEnvironment),
          tooltip: isComputePausable(cloudEnvironment)
            ? 'Pause cloud environment'
            : `Cannot pause a cloud environment while in status ${getDisplayStatus(cloudEnvironment)}.`,
          onClick: () => pauseComputeAndRefresh(cloudEnvironment),
        },
        [makeMenuIcon('pause'), 'Pause']
      )
    : null;
}

interface DecoratedResourceAttributes {
  workspace: WorkspaceInfo;
  unsupportedWorkspace: boolean;
}

type RuntimeWithWorkspace = DecoratedResourceAttributes & Runtime;
type DiskWithWorkspace = DecoratedResourceAttributes & DecoratedPersistentDisk;
type AppWithWorkspace = DecoratedResourceAttributes & App;

type DecoratedComputeResource = RuntimeWithWorkspace | AppWithWorkspace;
type DecoratedResource = DecoratedComputeResource | DiskWithWorkspace;

export interface EnvironmentsProps {
  nav?: any;
}

export const Environments: React.FC<EnvironmentsProps> = ({ nav = undefined }) => {
  const signal = useCancellation();
  const { workspaces, refresh: refreshWorkspaces } = _.flow(
    useWorkspaces,
    _.update('workspaces', _.flow(_.groupBy('workspace.namespace'), _.mapValues(_.keyBy('workspace.name'))))
  )();

  const getWorkspaces = useGetter(workspaces);
  const [runtimes, setRuntimes] = useState<RuntimeWithWorkspace[]>();
  const [apps, setApps] = useState<AppWithWorkspace[]>();
  const [disks, setDisks] = useState<DiskWithWorkspace[]>();
  const [loading, setLoading] = useState(false);
  const [errorRuntimeId, setErrorRuntimeId] = useState();
  const getErrorRuntimeId = useGetter(errorRuntimeId);
  const [deleteRuntimeId, setDeleteRuntimeId] = useState();
  const getDeleteRuntimeId = useGetter(deleteRuntimeId);
  const [deleteDiskId, setDeleteDiskId] = useState();
  const getDeleteDiskId = useGetter(deleteDiskId);
  const [errorAppId, setErrorAppId] = useState();
  const [deleteAppId, setDeleteAppId] = useState();
  const [sort, setSort] = useState({ field: 'project', direction: 'asc' });
  const [diskSort, setDiskSort] = useState({ field: 'project', direction: 'asc' });

  // TODO [IA-4432] restore the stateful var when checkbox reintroduced
  // const [shouldFilterByCreator, setShouldFilterByCreator] = useState(true);
  const shouldFilterByCreator = true;

  const ajax = useReplaceableAjaxExperimental();

  const currentUser = getUser().email;

  const refreshData = Utils.withBusyState(setLoading, async () => {
    await refreshWorkspaces();

    const workspaces = getWorkspaces();
    const getWorkspace = (namespace, name) => _.get(`${namespace}.${name}`, workspaces);

    const startTimeForLeoCallsEpochMs = Date.now();

    const listArgs: Record<string, string> = shouldFilterByCreator
      ? { role: 'creator', includeLabels: 'saturnWorkspaceNamespace,saturnWorkspaceName' }
      : { includeLabels: 'saturnWorkspaceNamespace,saturnWorkspaceName' };
    const [newRuntimes, newDisks, newApps] = await Promise.all([
      ajax(signal).Runtimes.listV2(listArgs),
      ajax(signal)
        .Disks.disksV1()
        .list({ ...listArgs, includeLabels: 'saturnApplication,saturnWorkspaceNamespace,saturnWorkspaceName' }),
      ajax(signal).Apps.listWithoutProject(listArgs),
    ]);
    const endTimeForLeoCallsEpochMs = Date.now();

    const leoCallTimeTotalMs = endTimeForLeoCallsEpochMs - startTimeForLeoCallsEpochMs;
    ajax(signal).Metrics.captureEvent(Events.cloudEnvironmentDetailsLoad, {
      leoCallTimeMs: leoCallTimeTotalMs,
      totalCallTimeMs: leoCallTimeTotalMs,
      runtimes: newRuntimes.length,
      disks: newDisks.length,
      apps: newApps.length,
    });

    const decorateLabeledResourceWithWorkspace = (
      cloudObject: Runtime | DecoratedPersistentDisk | App
    ): DecoratedResource => {
      const {
        labels: { saturnWorkspaceNamespace, saturnWorkspaceName },
      } = cloudObject;
      const { workspace = {} } = getWorkspace(saturnWorkspaceNamespace, saturnWorkspaceName) || {};
      // Attempting to catch resources related to GCP v1 workspces (Rawls no longer returns them).
      const unsupportedWorkspace =
        isGcpContext(cloudObject.cloudContext) &&
        (!workspace || cloudObject.cloudContext.cloudResource !== workspace.googleProject);

      return { ...cloudObject, workspace, unsupportedWorkspace };
    };

    const [decoratedRuntimes, decoratedDisks, decoratedApps] = _.map(_.map(decorateLabeledResourceWithWorkspace), [
      newRuntimes,
      mapToPdTypes(newDisks),
      newApps,
    ]);

    setRuntimes(decoratedRuntimes as RuntimeWithWorkspace[]);
    setDisks(decoratedDisks as DiskWithWorkspace[]);
    setApps(decoratedApps as AppWithWorkspace[]);

    if (!_.some({ id: getErrorRuntimeId() }, newRuntimes)) {
      setErrorRuntimeId(undefined);
    }
    if (!_.some({ id: getDeleteRuntimeId() }, newRuntimes)) {
      setDeleteRuntimeId(undefined);
    }
    if (!_.some({ id: getDeleteDiskId() }, newDisks)) {
      setDeleteDiskId(undefined);
    }
    if (!_.some({ appName: errorAppId }, newApps)) {
      setErrorAppId(undefined);
    }
    if (!_.some({ appName: deleteAppId }, newApps)) {
      setDeleteAppId(undefined);
    }
  });
  const loadData = withErrorIgnoring(refreshData);

  const pauseComputeAndRefresh = Utils.withBusyState(setLoading, async (compute: DecoratedComputeResource) => {
    const wrappedPauseCompute = withErrorReporting('Error pausing compute', () =>
      Utils.cond(
        [
          isRuntime(compute) && isGoogleWorkspaceInfo(compute.workspace),
          () =>
            ajax()
              .Runtimes.runtimeWrapper(compute as RuntimeWithWorkspace)
              .stop(),
        ],
        [
          isRuntime(compute),
          () =>
            ajax()
              .Runtimes.runtimeWrapper(compute as RuntimeWithWorkspace)
              .stop(),
        ],
        [
          isApp(compute) && isGoogleWorkspaceInfo(compute.workspace),
          // @ts-expect-error
          () => ajax().Apps.app(compute.workspace.googleProject, compute.appName).pause(),
        ],
        [Utils.DEFAULT, () => console.error('Pause is not currently implemented for azure apps')]
      )
    );
    await wrappedPauseCompute();
    await loadData();
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(refreshData, 30000);
    return () => {
      clearInterval(interval);
    };
  }, [shouldFilterByCreator]); // eslint-disable-line react-hooks/exhaustive-deps

  const getCloudProvider = (cloudEnvironment) =>
    Utils.cond(
      // TODO: AKS vs GKE apps
      [isApp(cloudEnvironment), () => 'Kubernetes'],
      [cloudEnvironment?.runtimeConfig?.cloudService === 'DATAPROC', () => 'Dataproc'],
      [Utils.DEFAULT, () => cloudEnvironment?.runtimeConfig?.cloudService]
    );

  const getCloudEnvTool = (cloudEnvironment) =>
    isApp(cloudEnvironment) ? _.capitalize(cloudEnvironment.appType) : _.capitalize(cloudEnvironment.labels.tool);

  const filteredRuntimes = _.orderBy(
    [
      {
        project: 'labels.saturnWorkspaceNamespace',
        workspace: 'labels.saturnWorkspaceName',
        type: getCloudProvider,
        tool: getCloudEnvTool,
        status: 'status',
        created: 'auditInfo.createdDate',
        accessed: 'auditInfo.dateAccessed',
        cost: getRuntimeCost,
      }[sort.field],
    ],
    // @ts-expect-error
    [sort.direction],
    runtimes
  );

  const filteredDisks = _.orderBy(
    [
      {
        project: 'googleProject',
        workspace: 'labels.saturnWorkspaceName',
        status: 'status',
        created: 'auditInfo.createdDate',
        accessed: 'auditInfo.dateAccessed',
        cost: getPersistentDiskCostMonthly,
        size: 'size',
      }[diskSort.field],
    ],
    // @ts-expect-error
    [diskSort.direction],
    disks
  );

  const filteredApps = _.orderBy(
    [
      {
        project: 'googleProject',
        workspace: 'labels.saturnWorkspaceName',
        status: 'status',
        created: 'auditInfo.createdDate',
        accessed: 'auditInfo.dateAccessed',
        cost: getAppCost,
      }[sort.field],
    ],
    // @ts-expect-error
    [sort.direction],
    apps
  );

  // @ts-expect-error
  const filteredCloudEnvironments: DecoratedComputeResource[] = _.concat(filteredRuntimes, filteredApps);

  const totalRuntimeCost = _.sum(_.map(getRuntimeCost, runtimes));
  const totalAppCost = _.sum(_.map(getGalaxyComputeCost, apps));
  const totalCost = totalRuntimeCost + totalAppCost;
  const totalDiskCost = disks
    ? _.sum(_.map((disk) => getPersistentDiskCostMonthly(disk, getRegionFromZone(disk.zone)), disks))
    : 0;

  const runtimesByProject = _.groupBy('googleProject', runtimes);
  const disksByProject = _.groupBy('googleProject', disks);

  // We start the first output string with an empty space because empty space would
  // not apply to the case where appType is not defined (e.g. Jupyter, RStudio).
  const forAppText = (appType) => (appType ? ` for ${_.capitalize(appType)}` : '');

  const getWorkspaceCell = (namespace, name, appType, shouldWarn, unsupportedWorkspace) => {
    if (unsupportedWorkspace) {
      // Don't want to include a link because there is no workspace to link to.
      return `${name} (unavailable)`;
    }
    return name
      ? h(Fragment, [
          h(
            Link,
            { href: nav.getLink('workspace-dashboard', { namespace, name }), style: { wordBreak: 'break-word' } },
            [name]
          ),
          shouldWarn &&
            h(
              TooltipTrigger,
              {
                content: `This workspace has multiple active cloud environments${forAppText(
                  appType
                )}. Only the latest one will be used.`,
              },
              [icon('warning-standard', { style: { marginLeft: '0.25rem', color: colors.warning() } })]
            ),
        ])
      : 'information unavailable';
  };

  // Old apps, runtimes and disks may not have 'saturnWorkspaceNamespace' label defined. When they were
  // created, workspace namespace (a.k.a billing project) value used to equal the google project.
  // Therefore we use google project if the namespace label is not defined.
  const renderWorkspaceForApps = (app) => {
    const {
      appType,
      cloudContext: { cloudResource },
      labels: { saturnWorkspaceNamespace, saturnWorkspaceName },
    } = app;
    // Here, we use the saturnWorkspaceNamespace label if its defined, otherwise use cloudResource for older runtimes
    const resolvedSaturnWorkspaceNamespace = saturnWorkspaceNamespace || cloudResource;
    return getWorkspaceCell(
      resolvedSaturnWorkspaceNamespace,
      saturnWorkspaceName,
      appType,
      false,
      app.unsupportedWorkspace
    );
  };

  const renderWorkspaceForRuntimes = (runtime) => {
    const {
      status,
      googleProject,
      labels: { saturnWorkspaceNamespace = googleProject, saturnWorkspaceName = undefined } = {},
    } = runtime;
    // TODO: Azure runtimes are not covered in this logic
    const shouldWarn =
      doesUserHaveDuplicateRuntimes(getCreatorForCompute(runtime), runtimesByProject[googleProject]) &&
      !_.includes(status, ['Deleting', 'Error']);
    return getWorkspaceCell(
      saturnWorkspaceNamespace,
      saturnWorkspaceName,
      null,
      shouldWarn,
      runtime.unsupportedWorkspace
    );
  };

  const doesUserHaveDuplicateRuntimes = (user, runtimes) => {
    const runtimesForUser = _.flow(_.map(getCreatorForCompute), _.filter(!_.eq(user)))(runtimes);
    return runtimesForUser.length > 1;
  };

  const getDetailsPopup = (cloudEnvName, billingId, disk, creator, workspaceId) => {
    return h(
      PopupTrigger,
      {
        content: div({ style: { padding: '0.5rem', overflowWrap: 'break-word', width: '30em' } }, [
          div([strong(['Name: ']), cloudEnvName]),
          div([strong(['Billing ID: ']), billingId]),
          workspaceId && div([strong(['Workspace ID: ']), workspaceId]),
          !shouldFilterByCreator && div([strong(['Creator: ']), creator]),
          !!disk && div([strong(['Persistent Disk: ']), disk.name]),
        ]),
      },
      // @ts-expect-error
      [h(Link, ['view'])]
    );
  };

  const renderDetailsApp = (app, disks) => {
    const {
      appName,
      cloudContext,
      diskName,
      auditInfo: { creator },
      workspace: { workspaceId = undefined } = {},
    } = app;
    const disk = _.find({ name: diskName }, disks);
    return getDetailsPopup(appName, cloudContext?.cloudResource, disk, creator, workspaceId);
  };

  const renderDetailsRuntime = (runtime, disks) => {
    const {
      runtimeName,
      cloudContext,
      runtimeConfig: { persistentDiskId = undefined } = {},
      auditInfo: { creator },
      workspace,
    } = runtime;
    const disk = _.find({ id: persistentDiskId }, disks);
    return getDetailsPopup(runtimeName, cloudContext?.cloudResource, disk, creator, workspace?.workspaceId);
  };

  const renderDeleteButton = (resourceType, resource) => {
    const isDeletable = isResourceDeletable(resourceType, resource);
    const resourceId = resourceType === 'app' ? resource.appName : resource.id;
    const action = Utils.switchCase(
      resourceType,
      ['runtime', () => setDeleteRuntimeId],
      ['app', () => setDeleteAppId],
      ['disk', () => setDeleteDiskId]
    );

    return h(
      Link,
      {
        disabled: !isDeletable,
        tooltip: isDeletable
          ? 'Delete cloud environment'
          : `Cannot delete a cloud environment while in status ${_.upperCase(
              getDisplayRuntimeStatus(resource.status)
            )}.`,
        onClick: () => action(resourceId),
      },
      [makeMenuIcon('trash'), 'Delete']
    );
  };

  const renderErrorApps = (app) => {
    const convertedAppStatus = getDisplayRuntimeStatus(app.status);
    if (convertedAppStatus !== 'Error' && app.unsupportedWorkspace) {
      return h(UnsupportedWorkspaceCell, { status: convertedAppStatus, message: unsupportedCloudEnvironmentMessage });
    }
    return h(Fragment, [
      convertedAppStatus,
      convertedAppStatus === 'Error' &&
        h(
          Clickable,
          {
            tooltip: 'View error',
            onClick: () => setErrorAppId(app.appName),
          },
          [icon('warning-standard', { style: { marginLeft: '0.25rem', color: colors.danger() } })]
        ),
    ]);
  };

  const renderErrorRuntimes = (runtime) => {
    const convertedRuntimeStatus = getDisplayRuntimeStatus(runtime.status);
    if (convertedRuntimeStatus !== 'Error' && runtime.unsupportedWorkspace) {
      return h(UnsupportedWorkspaceCell, {
        status: convertedRuntimeStatus,
        message: unsupportedCloudEnvironmentMessage,
      });
    }
    return h(Fragment, [
      convertedRuntimeStatus,
      convertedRuntimeStatus === 'Error' &&
        h(
          Clickable,
          {
            tooltip: 'View error',
            onClick: () => setErrorRuntimeId(runtime.id),
          },
          [icon('warning-standard', { style: { marginLeft: '0.25rem', color: colors.danger() } })]
        ),
    ]);
  };

  const renderDeleteDiskModal = (disk) => {
    return h(DeleteDiskModal, {
      disk,
      isGalaxyDisk: getDiskAppType(disk) === appTools.GALAXY.label,
      onDismiss: () => setDeleteDiskId(undefined),
      onSuccess: () => {
        setDeleteDiskId(undefined);
        loadData();
      },
    });
  };

  const multipleDisksError = (disks: DecoratedPersistentDisk[], appType: AppToolLabel | undefined) => {
    // appType is undefined for runtimes (ie Jupyter, RStudio) so the first part of the ternary is for processing app
    // disks. the second part is for processing runtime disks so it filters out app disks
    return appType
      ? workspaceHasMultipleDisks(disks, appType)
      : _.remove((disk) => getDiskAppType(disk) !== appType || disk.status === 'Deleting', disks).length > 1;
  };

  const runtimeToDelete: RuntimeWithWorkspace | undefined = _.find({ id: deleteRuntimeId }, runtimes);
  const appToDelete: AppWithWorkspace | undefined = _.find({ appName: deleteAppId }, apps);

  return h(Fragment, [
    div({ role: 'main', style: { padding: '1rem', flexGrow: 1 } }, [
      h2({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase', margin: '0 0 1rem 0', padding: 0 } }, [
        'Your cloud environments',
      ]),
      // TODO [IA-4432] reenable this checkbox when query performance is fixed
      // div({ style: { marginBottom: '.5rem' } }, [
      //   h(LabeledCheckbox, { checked: shouldFilterByCreator, onChange: setShouldFilterByCreator }, [
      //     span({ style: { fontWeight: 600 } }, [' Hide resources you did not create']),
      //   ]),
      // ]),
      runtimes &&
        div({ style: { overflow: 'scroll', overflowWrap: 'break-word', wordBreak: 'break-all' } }, [
          h(SimpleFlexTable, {
            'aria-label': 'cloud environments',
            // @ts-expect-error
            sort,
            rowCount: filteredCloudEnvironments.length,
            columns: [
              {
                size: { min: '12em' },
                field: 'project',
                headerRenderer: () => h(Sortable, { sort, field: 'project', onSort: setSort }, ['Billing project']),
                cellRenderer: ({ rowIndex }) => {
                  const cloudEnv: DecoratedComputeResource = filteredCloudEnvironments[rowIndex];
                  const workspaceNamespace = cloudEnv.workspace.namespace;
                  const {
                    labels: { saturnWorkspaceNamespace = workspaceNamespace },
                  } = cloudEnv;
                  return saturnWorkspaceNamespace;
                },
              },
              {
                size: { min: '10em' },
                field: 'workspace',
                headerRenderer: () => h(Sortable, { sort, field: 'workspace', onSort: setSort }, ['Workspace']),
                cellRenderer: ({ rowIndex }) => {
                  const cloudEnvironment = filteredCloudEnvironments[rowIndex];
                  return isApp(cloudEnvironment)
                    ? renderWorkspaceForApps(cloudEnvironment)
                    : renderWorkspaceForRuntimes(cloudEnvironment);
                },
              },
              {
                size: { min: '10em', grow: 0 },
                headerRenderer: () => h(Sortable, { sort, field: 'type', onSort: setSort }, ['Type']),
                cellRenderer: ({ rowIndex }) => getCloudProvider(filteredCloudEnvironments[rowIndex]),
              },
              {
                size: { min: '8em', grow: 0 },
                headerRenderer: () => h(Sortable, { sort, field: 'tool', onSort: setSort }, ['Tool']),
                cellRenderer: ({ rowIndex }) => getCloudEnvTool(filteredCloudEnvironments[rowIndex]),
              },
              {
                size: { min: '7em', grow: 0 },
                headerRenderer: () => 'Details',
                cellRenderer: ({ rowIndex }) => {
                  const cloudEnvironment = filteredCloudEnvironments[rowIndex];
                  return isApp(cloudEnvironment)
                    ? renderDetailsApp(cloudEnvironment, disks)
                    : renderDetailsRuntime(cloudEnvironment, disks);
                },
              },
              {
                size: { min: '9em', grow: 0 },
                field: 'status',
                headerRenderer: () => h(Sortable, { sort, field: 'status', onSort: setSort }, ['Status']),
                cellRenderer: ({ rowIndex }) => {
                  const cloudEnvironment = filteredCloudEnvironments[rowIndex];
                  return isApp(cloudEnvironment)
                    ? renderErrorApps(cloudEnvironment)
                    : renderErrorRuntimes(cloudEnvironment);
                },
              },
              {
                size: { min: '10em', grow: 0.2 },
                headerRenderer: () => 'Location',
                cellRenderer: ({ rowIndex }) => {
                  const cloudEnvironment = filteredCloudEnvironments[rowIndex];
                  // We assume that all apps get created in zone 'us-central1-a'.
                  // If zone or region is not present then cloudEnvironment is an app so we return 'us-central1-a'.
                  const location = isRuntime(cloudEnvironment)
                    ? isGceConfig(cloudEnvironment.runtimeConfig) || isGceWithPdConfig(cloudEnvironment.runtimeConfig)
                      ? cloudEnvironment.runtimeConfig.zone
                      : _.toLower(getNormalizedComputeRegion(cloudEnvironment.runtimeConfig))
                    : defaultComputeZone.toLowerCase();
                  return location;
                },
              },
              {
                size: { min: '10em', grow: 0 },
                field: 'created',
                headerRenderer: () => h(Sortable, { sort, field: 'created', onSort: setSort }, ['Created']),
                cellRenderer: ({ rowIndex }) => {
                  return Utils.makeCompleteDate(filteredCloudEnvironments[rowIndex].auditInfo.createdDate);
                },
              },
              {
                size: { min: '11em', grow: 0 },
                field: 'accessed',
                headerRenderer: () => h(Sortable, { sort, field: 'accessed', onSort: setSort }, ['Last accessed']),
                cellRenderer: ({ rowIndex }) => {
                  return Utils.makeCompleteDate(filteredCloudEnvironments[rowIndex].auditInfo.dateAccessed);
                },
              },
              {
                size: { min: '14em', grow: 0 },
                field: 'cost',
                headerRenderer: () =>
                  h(Sortable, { sort, field: 'cost', onSort: setSort }, [
                    `Cost / hr (${Utils.formatUSD(totalCost)} total)`,
                  ]),
                cellRenderer: ({ rowIndex }) => {
                  const cloudEnvironment = filteredCloudEnvironments[rowIndex];
                  return isApp(cloudEnvironment)
                    ? Utils.formatUSD(getGalaxyComputeCost(cloudEnvironment))
                    : Utils.formatUSD(getRuntimeCost(cloudEnvironment));
                },
              },
              {
                size: { min: '13em', grow: 0 },
                headerRenderer: () => 'Actions',
                cellRenderer: ({ rowIndex }) => {
                  const cloudEnvironment = filteredCloudEnvironments[rowIndex];
                  const computeType = isApp(cloudEnvironment) ? 'app' : 'runtime';
                  return h(Fragment, [
                    h(PauseButton, { cloudEnvironment, currentUser, pauseComputeAndRefresh }),
                    renderDeleteButton(computeType, cloudEnvironment),
                  ]);
                },
              },
            ],
          }),
        ]),
      h2({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase', margin: '1rem 0', padding: 0 } }, [
        'Your persistent disks',
      ]),
      disks &&
        div({ style: { overflow: 'scroll', overflowWrap: 'break-word', wordBreak: 'break-all' } }, [
          h(SimpleFlexTable, {
            'aria-label': 'persistent disks',
            // @ts-expect-error
            sort: diskSort,
            rowCount: filteredDisks.length,
            columns: [
              {
                size: { min: '12em' },
                field: 'project',
                headerRenderer: () =>
                  h(Sortable, { sort: diskSort, field: 'project', onSort: setDiskSort }, ['Billing project']),
                cellRenderer: ({ rowIndex }) => {
                  const {
                    googleProject,
                    labels: { saturnWorkspaceNamespace = googleProject },
                  } = filteredDisks[rowIndex];
                  return saturnWorkspaceNamespace;
                },
              },
              {
                size: { min: '10em' },
                field: 'workspace',
                headerRenderer: () =>
                  h(Sortable, { sort: diskSort, field: 'workspace', onSort: setDiskSort }, ['Workspace']),
                cellRenderer: ({ rowIndex }) => {
                  const {
                    status: diskStatus,
                    googleProject,
                    workspace: { namespace, name },
                    creator,
                  } = filteredDisks[rowIndex];
                  const appType: AppToolLabel | undefined = getDiskAppType(filteredDisks[rowIndex]);
                  const multipleDisks = multipleDisksError(disksByProject[googleProject], appType);
                  return !!namespace && !!name
                    ? h(Fragment, [
                        h(
                          Link,
                          {
                            href: nav.getLink('workspace-dashboard', { namespace, name }),
                            style: { wordBreak: 'break-word' },
                          },
                          [name]
                        ),
                        currentUser === creator &&
                          diskStatus !== 'Deleting' &&
                          multipleDisks &&
                          h(
                            TooltipTrigger,
                            {
                              content: `This workspace has multiple active persistent disks${forAppText(
                                appType
                              )}. Only the latest one will be used.`,
                            },
                            [icon('warning-standard', { style: { marginLeft: '0.25rem', color: colors.warning() } })]
                          ),
                      ])
                    : 'information unavailable';
                },
              },
              {
                size: { min: '6em', grow: 0 },
                headerRenderer: () => 'Details',
                cellRenderer: ({ rowIndex }) => {
                  const {
                    name,
                    id,
                    cloudContext,
                    workspace,
                    auditInfo: { creator },
                  } = filteredDisks[rowIndex];
                  const runtime = _.find({ runtimeConfig: { persistentDiskId: id } }, runtimes);
                  const app = _.find({ diskName: name }, apps);
                  return h(
                    PopupTrigger,
                    {
                      content: div({ style: { padding: '0.5rem', overflowWrap: 'break-word', width: '30em' } }, [
                        div([strong(['Name: ']), name]),
                        div([strong(['Billing ID: ']), cloudContext.cloudResource]),
                        workspace && div([strong(['Workspace ID: ']), workspace.workspaceId]),
                        !shouldFilterByCreator && div([strong(['Creator: ']), creator]),
                        runtime && div([strong(['Runtime: ']), runtime.runtimeName]),
                        app && div([strong([`${_.capitalize(app.appType)}: `]), app.appName]),
                      ]),
                    },
                    // @ts-expect-error
                    [h(Link, ['view'])]
                  );
                },
              },
              {
                size: { min: '5em', grow: 0 },
                field: 'size',
                headerRenderer: () =>
                  h(Sortable, { sort: diskSort, field: 'size', onSort: setDiskSort }, ['Size (GB)']),
                cellRenderer: ({ rowIndex }) => {
                  const disk = filteredDisks[rowIndex];
                  return disk.size;
                },
              },
              {
                size: { min: '8em', grow: 0 },
                field: 'status',
                headerRenderer: () => h(Sortable, { sort: diskSort, field: 'status', onSort: setDiskSort }, ['Status']),
                cellRenderer: ({ rowIndex }) => {
                  const disk = filteredDisks[rowIndex];
                  return disk.unsupportedWorkspace
                    ? h(UnsupportedWorkspaceCell, { status: disk.status, message: unsupportedDiskMessage })
                    : disk.status;
                },
              },
              {
                size: { min: '10em', grow: 0.2 },
                headerRenderer: () => 'Location',
                cellRenderer: ({ rowIndex }) => {
                  const disk = filteredDisks[rowIndex];
                  return disk.zone;
                },
              },
              {
                size: { min: '10em', grow: 0 },
                field: 'created',
                headerRenderer: () =>
                  h(Sortable, { sort: diskSort, field: 'created', onSort: setDiskSort }, ['Created']),
                cellRenderer: ({ rowIndex }) => {
                  return Utils.makeCompleteDate(filteredDisks[rowIndex].auditInfo.createdDate);
                },
              },
              {
                size: { min: '11em', grow: 0 },
                field: 'accessed',
                headerRenderer: () =>
                  h(Sortable, { sort: diskSort, field: 'accessed', onSort: setDiskSort }, ['Last accessed']),
                cellRenderer: ({ rowIndex }) => {
                  return Utils.makeCompleteDate(filteredDisks[rowIndex].auditInfo.dateAccessed);
                },
              },
              {
                size: { min: '10em', grow: 0 },
                field: 'cost',
                headerRenderer: () => {
                  return h(Sortable, { sort: diskSort, field: 'cost', onSort: setDiskSort }, [
                    `Cost / month (${Utils.formatUSD(totalDiskCost)} total)`,
                  ]);
                },
                cellRenderer: ({ rowIndex }) => {
                  const disk = filteredDisks[rowIndex];
                  const diskRegion = getRegionFromZone(disk.zone);
                  return Utils.formatUSD(getPersistentDiskCostMonthly(disk, diskRegion));
                },
              },
              {
                size: { min: '10em', grow: 0 },
                headerRenderer: () => 'Action',
                cellRenderer: ({ rowIndex }) => {
                  const { id, status, name } = filteredDisks[rowIndex];
                  const error = Utils.cond(
                    [status === 'Creating', () => 'Cannot delete this disk because it is still being created.'],
                    [status === 'Deleting', () => 'The disk is being deleted.'],
                    [
                      _.some({ runtimeConfig: { persistentDiskId: id } }, runtimes) || _.some({ diskName: name }, apps),
                      () =>
                        'Cannot delete this disk because it is attached. You must delete the cloud environment first.',
                    ]
                  );
                  return h(
                    Link,
                    {
                      disabled: !!error,
                      tooltip: error || 'Delete persistent disk',
                      onClick: () => setDeleteDiskId(id),
                    },
                    [makeMenuIcon('trash'), 'Delete']
                  );
                },
              },
            ],
          }),
        ]),
      errorRuntimeId &&
        h(RuntimeErrorModal, {
          runtime: _.find({ id: errorRuntimeId }, runtimes),
          onDismiss: () => setErrorRuntimeId(undefined),
        }),
      deleteRuntimeId &&
        runtimeToDelete &&
        h(DeleteRuntimeModal, {
          runtime: runtimeToDelete,
          workspaceId: runtimeToDelete.workspace.workspaceId,
          onDismiss: () => setDeleteRuntimeId(undefined),
          onSuccess: () => {
            setDeleteRuntimeId(undefined);
            loadData();
          },
        }),
      deleteDiskId && renderDeleteDiskModal(_.find({ id: deleteDiskId }, disks)),
      deleteAppId &&
        appToDelete &&
        h(DeleteAppModal, {
          app: appToDelete,
          onDismiss: () => setDeleteAppId(undefined),
          onSuccess: () => {
            setDeleteAppId(undefined);
            loadData();
          },
        }),
      errorAppId &&
        h(AppErrorModal, {
          app: _.find({ appName: errorAppId }, apps),
          onDismiss: () => setErrorAppId(undefined),
        }),
    ]),
    contactUsActive.get() && h(SupportRequestWrapper),
    loading && spinnerOverlay,
  ]);
};

// Temporary export here for ease of access to it when using the above component from outside of
// this repository.
export { ajaxContext } from 'src/libs/ajax';
