import { delay } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import { CSSProperties, Fragment, ReactNode, useState } from 'react';
import { div, h, label, p, strong } from 'react-hyperscript-helpers';
import { defaultLocation } from 'src/analysis/utils/runtime-utils';
import { CloudProviderIcon } from 'src/components/CloudProviderIcon';
import { ButtonPrimary, IdContainer, LabeledCheckbox, Link, Select, spinnerOverlay } from 'src/components/common';
import { icon } from 'src/components/icons';
import { InfoBox } from 'src/components/InfoBox';
import { TextArea, ValidatedInput } from 'src/components/input';
import Modal from 'src/components/Modal';
import {
  allRegions,
  availableBucketRegions,
  getLocationType,
  getRegionInfo,
  isSupportedBucketLocation,
} from 'src/components/region-common';
import TooltipTrigger from 'src/components/TooltipTrigger';
import { Ajax } from 'src/libs/ajax';
import { resolveWdsApp } from 'src/libs/ajax/data-table-providers/WdsDataTableProvider';
import { CurrentUserGroupMembership } from 'src/libs/ajax/Groups';
import { ListAppItem } from 'src/libs/ajax/leonardo/models/app-models';
import colors from 'src/libs/colors';
import { getConfig } from 'src/libs/config';
import { reportErrorAndRethrow, withErrorReportingInModal } from 'src/libs/error';
import Events, { extractCrossWorkspaceDetails, extractWorkspaceDetails } from 'src/libs/events';
import { FormLabel } from 'src/libs/forms';
import * as Nav from 'src/libs/nav';
import { useCancellation, useOnMount, withDisplayName } from 'src/libs/react-utils';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import {
  cloudProviderLabels,
  isAzureWorkspace,
  isGoogleWorkspace,
  isProtectedWorkspace,
  protectedDataMessage,
  WorkspaceInfo,
  WorkspaceWrapper,
} from 'src/libs/workspace-utils';
import {
  AzureBillingProject,
  BillingProject,
  CloudPlatform,
  GCPBillingProject,
} from 'src/pages/billing/models/BillingProject';
import { CreatingWorkspaceMessage } from 'src/workspaces/NewWorkspaceModal/CreatingWorkspaceMessage';
import { WorkspacePolicies } from 'src/workspaces/WorkspacePolicies/WorkspacePolicies';
import validate from 'validate.js';

const warningStyle: CSSProperties = {
  border: `1px solid ${colors.warning(0.8)}`,
  borderRadius: '5px',
  backgroundColor: colors.warning(0.15),
  display: 'flex',
  lineHeight: '18px',
  padding: '1rem 1rem',
  margin: '0.5rem 0 1rem',
  fontWeight: 'normal',
  fontSize: 14,
};

const constraints = {
  name: {
    presence: { allowEmpty: false },
    length: { maximum: 254 },
    format: {
      pattern: /[\w- ]*/,
      message: 'can only contain letters, numbers, dashes, underscores, and spaces',
    },
  },
  namespace: {
    presence: true,
  },
};

const invalidBillingAccountMsg =
  'Workspaces may only be created in billing projects that have a Google billing account accessible in Terra';

const ariaInvalidBillingAccountMsg = (invalidBillingAccount: boolean): string => {
  return invalidBillingAccount ? ` with warning "${invalidBillingAccountMsg}"` : '';
};

export interface NewWorkspaceModalProps {
  buttonText?: string;
  cloneWorkspace?: WorkspaceWrapper;
  cloudPlatform?: CloudPlatform;
  renderNotice?: (args: { selectedBillingProject?: BillingProject }) => ReactNode;
  requiredAuthDomain?: string;
  requireEnhancedBucketLogging?: boolean;
  title?: string;
  waitForServices?: {
    wds?: boolean;
  };
  workflowImport?: boolean;
  onDismiss: () => void;
  onSuccess: (newWorkspace: WorkspaceInfo) => void;
}

const NewWorkspaceModal = withDisplayName(
  'NewWorkspaceModal',
  ({
    cloneWorkspace,
    cloudPlatform,
    onSuccess,
    onDismiss,
    renderNotice = () => null,
    requiredAuthDomain,
    requireEnhancedBucketLogging,
    title,
    buttonText,
    waitForServices,
    workflowImport,
  }: NewWorkspaceModalProps) => {
    // State
    const [billingProjects, setBillingProjects] = useState<BillingProject[]>();
    const [azureBillingProjectsExist, setAzureBillingProjectsExist] = useState(false);
    const [allGroups, setAllGroups] = useState<CurrentUserGroupMembership[]>();
    const [name, setName] = useState(cloneWorkspace ? `${cloneWorkspace.workspace.name} copy` : '');
    const [namespace, setNamespace] = useState(cloneWorkspace ? cloneWorkspace.workspace.namespace : undefined);
    const [description, setDescription] = useState(cloneWorkspace?.workspace.attributes?.description || '');
    const [groups, setGroups] = useState<string[]>([]);
    const [enhancedBucketLogging, setEnhancedBucketLogging] = useState(!!requireEnhancedBucketLogging);
    const [nameModified, setNameModified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string>();
    const [bucketLocation, setBucketLocation] = useState(defaultLocation);
    const [sourceWorkspaceLocation, setSourceWorkspaceLocation] = useState(defaultLocation);
    const [isAlphaRegionalityUser, setIsAlphaRegionalityUser] = useState(false);
    const signal = useCancellation();

    // Helpers
    const getRequiredGroups = (): string[] =>
      _.uniq([
        ...(cloneWorkspace ? _.map('membersGroupName', cloneWorkspace.workspace.authorizationDomain) : []),
        ...(requiredAuthDomain ? [requiredAuthDomain] : []),
      ]);

    const loadAlphaRegionalityUser = reportErrorAndRethrow('Error loading regionality group membership')(async () => {
      setIsAlphaRegionalityUser(await Ajax(signal).Groups.group(getConfig().alphaRegionalityGroup).isMember());
    });

    const create = async (): Promise<void> => {
      try {
        setCreateError(undefined);
        setCreating(true);

        const body = {
          namespace,
          name,
          authorizationDomain: _.map((v) => ({ membersGroupName: v }), [...getRequiredGroups(), ...groups]),
          attributes: { description },
          copyFilesWithPrefix: isGoogleBillingProject() ? 'notebooks/' : 'analyses/',
          ...(!!bucketLocation && isGoogleBillingProject() && { bucketLocation }),
          enhancedBucketLogging,
        };
        const createdWorkspace = await Utils.cond(
          [
            !!cloneWorkspace,
            async () => {
              const workspace = await Ajax()
                .Workspaces.workspace(cloneWorkspace!.workspace.namespace, cloneWorkspace!.workspace.name)
                .clone(body);
              const featuredList = await Ajax().FirecloudBucket.getFeaturedWorkspaces();
              Ajax().Metrics.captureEvent(Events.workspaceClone, {
                featured: _.some(
                  { namespace: cloneWorkspace!.workspace.namespace, name: cloneWorkspace!.workspace.name },
                  featuredList
                ),
                ...extractCrossWorkspaceDetails(cloneWorkspace!, {
                  // Clone response does not include cloudPlatform, cross-cloud cloning is not supported.
                  workspace: _.merge(workspace, { cloudPlatform: getProjectCloudPlatform() }),
                }),
              });
              return workspace;
            },
          ],
          async () => {
            const workspace = await Ajax().Workspaces.create(body);
            Ajax().Metrics.captureEvent(
              Events.workspaceCreate,
              extractWorkspaceDetails(
                // Create response does not include cloudPlatform.
                _.merge(workspace, { cloudPlatform: getProjectCloudPlatform() })
              )
            );
            return workspace;
          }
        );

        // The create/clone workspace responses do not include the cloudPlatform field.
        // Add it based on the billing project used to create the workspace.

        // Translate between billing project cloud platform and workspace cloud platform constants.
        const workspaceCloudPlatform: WorkspaceInfo['cloudPlatform'] | undefined = (() => {
          const billingProjectCloudPlatform = getProjectCloudPlatform();
          switch (billingProjectCloudPlatform) {
            case 'AZURE':
              return 'Azure';
            case 'GCP':
              return 'Gcp';
            default:
              return undefined;
          }
        })();

        if (getProjectCloudPlatform() === 'AZURE' && waitForServices?.wds) {
          // WDS takes some time to start up, so there's no need to immediately start checking if it's running.
          await delay(30000);

          // Wait for the WDS app to be running.
          const wds = await Utils.poll(
            async () => {
              const workspaceApps: ListAppItem[] = await Ajax().Apps.listAppsV2(createdWorkspace.workspaceId);
              const wdsApp = resolveWdsApp(workspaceApps);
              if (wdsApp?.status === 'RUNNING') {
                return { shouldContinue: false, result: wdsApp };
              }
              if (wdsApp?.status === 'ERROR') {
                throw new Error('Failed to provision data services for new workspace.');
              }
              return { shouldContinue: true, result: null };
            },
            15000,
            true
          );

          // Wait for the default WDS instance to exist.
          const proxyUrl = wds!.proxyUrls.wds;
          await Utils.poll(
            async () => {
              const instances: string[] = await Ajax().WorkspaceData.listInstances(proxyUrl);
              if (instances.includes(createdWorkspace.workspaceId)) {
                return { shouldContinue: false, result: true };
              }
              return { shouldContinue: true, result: false };
            },
            5000,
            true
          );
        }

        onSuccess({ ...createdWorkspace, cloudPlatform: workspaceCloudPlatform });
      } catch (error: unknown) {
        const errorMessage = await (async () => {
          if (error instanceof Response) {
            try {
              const { message } = await error.json();
              return message;
            } catch (readResponseError) {
              return 'Unknown error.';
            }
          }
          if (error instanceof Error) {
            return error.message;
          }
          return 'Unknown error.';
        })();
        setCreating(false);
        setCreateError(errorMessage);
      }
    };

    const loadData = _.flow(
      withErrorReportingInModal('Error loading data', onDismiss),
      Utils.withBusyState(setLoading)
    )(() =>
      Promise.all([
        Ajax(signal)
          .Billing.listProjects()
          .then(_.filter({ status: 'Ready' }))
          .then(
            _.forEach((project: BillingProject) => {
              if (isAzureBillingProject(project)) {
                setAzureBillingProjectsExist(true);
              }
            })
          )
          .then(_.filter((project: BillingProject) => isBillingProjectApplicable(project)))
          .then((projects: BillingProject[]) => {
            setBillingProjects(projects);
            setNamespace(_.some({ projectName: namespace }, projects) ? namespace : undefined);
          }),
        Ajax(signal).Groups.list().then(setAllGroups),
        !!cloneWorkspace &&
          isGoogleWorkspace(cloneWorkspace) &&
          Ajax(signal)
            .Workspaces.workspace(namespace, cloneWorkspace.workspace.name)
            .checkBucketLocation(cloneWorkspace.workspace.googleProject, cloneWorkspace.workspace.bucketName)
            .then(({ location }) => {
              // For current phased regionality release, we only allow US or NORTHAMERICA-NORTHEAST1 (Montreal) workspace buckets.
              setBucketLocation(isSupportedBucketLocation(location) ? location : defaultLocation);
              setSourceWorkspaceLocation(location);
            }),
      ])
    );

    const shouldShowDifferentRegionWarning = () => {
      return !!cloneWorkspace && bucketLocation !== sourceWorkspaceLocation;
    };

    const isAzureBillingProject = (project?: BillingProject): project is AzureBillingProject =>
      isCloudProviderBillingProject(project, 'AZURE');

    const isGoogleBillingProject = (project?: BillingProject): project is GCPBillingProject =>
      isCloudProviderBillingProject(project, 'GCP');

    const isCloudProviderBillingProject = (
      project: BillingProject | undefined,
      cloudProvider: CloudPlatform
    ): boolean => getProjectCloudPlatform(project) === cloudProvider;

    const getProjectCloudPlatform = (project?: BillingProject): CloudPlatform | undefined => {
      if (project === undefined) {
        project = _.find({ projectName: namespace }, billingProjects);
      }
      return project?.cloudPlatform;
    };

    const isBillingProjectApplicable = (project: BillingProject): boolean => {
      // This is used when importing data to enforce a specific cloud.
      if (cloudPlatform && project.cloudPlatform !== cloudPlatform) {
        return false;
      }
      if (workflowImport) {
        return !isAzureBillingProject(project);
      }
      // If we aren't cloning a workspace and enhanced bucket logging is required, allow all GCP projects
      // (user will be forced to select "Workspace will have protected data" for GCP projects)
      // and Azure billing projects that support protected Data.
      if (!cloneWorkspace && requireEnhancedBucketLogging && isAzureBillingProject(project)) {
        return project.protectedData;
      }
      // Only support cloning a workspace to the same cloud platform. If this changes, also update
      // the Events.workspaceClone event data.
      if (!!cloneWorkspace && isAzureWorkspace(cloneWorkspace)) {
        if (isAzureBillingProject(project)) {
          return isProtectedWorkspace(cloneWorkspace) ? project.protectedData : true;
        }
        return false;
      }
      if (!!cloneWorkspace && isGoogleWorkspace(cloneWorkspace)) {
        return isGoogleBillingProject(project);
      }
      return true;
    };

    // Lifecycle
    useOnMount(() => {
      loadData();
      loadAlphaRegionalityUser();
    });

    // Render
    const existingGroups = getRequiredGroups();
    const hasBillingProjects = !!billingProjects && !!billingProjects.length;
    const errors = validate({ namespace, name }, constraints, {
      prettify: (v) => ({ namespace: 'Billing project', name: 'Name' }[v] || validate.prettify(v)),
    });

    const sourceLocationType = getLocationType(sourceWorkspaceLocation);
    const destLocationType = getLocationType(bucketLocation);

    const onFocusAria = ({ focused, isDisabled }) => {
      return `${isDisabled ? 'Disabled option ' : 'Option '}${focused['aria-label']}, focused.`;
    };

    const onChangeAria = ({ value }) => {
      return !value ? '' : `Option ${value['aria-label']} selected.`;
    };

    const getNoApplicableBillingProjectsMessage = () => {
      if (cloneWorkspace) {
        return 'You do not have a billing project that is able to clone this workspace.';
      }
      return requireEnhancedBucketLogging
        ? 'You do not have access to a billing project that supports additional security monitoring.'
        : 'You need a billing project to create a new workspace.';
    };

    return Utils.cond(
      [loading, () => spinnerOverlay],
      [
        hasBillingProjects,
        () =>
          h(
            Modal,
            {
              title: Utils.cond(
                [!!title, () => title],
                [!!cloneWorkspace, () => 'Clone this workspace'],
                () => 'Create a New Workspace'
              ),
              // Hold modal open while waiting for create workspace request.
              shouldCloseOnOverlayClick: !creating,
              shouldCloseOnEsc: !creating,
              showButtons: !creating,
              onDismiss,
              okButton: h(
                ButtonPrimary,
                {
                  disabled: errors,
                  tooltip: Utils.summarizeErrors(errors),
                  onClick: create,
                },
                [
                  Utils.cond(
                    [!!buttonText, () => buttonText],
                    [!!cloneWorkspace, () => 'Clone Workspace'],
                    () => 'Create Workspace'
                  ),
                ]
              ),
            },
            [
              creating
                ? h(CreatingWorkspaceMessage)
                : h(Fragment, [
                    h(IdContainer, [
                      (id) =>
                        h(Fragment, [
                          h(FormLabel, { htmlFor: id, required: true }, ['Workspace name']),
                          h(ValidatedInput, {
                            inputProps: {
                              id,
                              autoFocus: true,
                              placeholder: 'Enter a name',
                              value: name,
                              onChange: (v) => {
                                setName(v);
                                setNameModified(true);
                              },
                            },
                            error: Utils.summarizeErrors(nameModified && errors?.name),
                          }),
                        ]),
                    ]),
                    h(IdContainer, [
                      (id) =>
                        h(Fragment, [
                          h(FormLabel, { htmlFor: id, required: true }, ['Billing project']),
                          h(Select as typeof Select<string>, {
                            id,
                            isClearable: false,
                            placeholder: 'Select a billing project',
                            value: namespace || null,
                            ariaLiveMessages: { onFocus: onFocusAria, onChange: onChangeAria },
                            onChange: (opt) => setNamespace(opt!.value),
                            styles: { option: (provided) => ({ ...provided, padding: 10 }) },
                            // @ts-expect-error
                            options: _.map(
                              ({ projectName, invalidBillingAccount, cloudPlatform }: BillingProject) => ({
                                'aria-label': `${
                                  cloudProviderLabels[cloudPlatform]
                                } ${projectName}${ariaInvalidBillingAccountMsg(invalidBillingAccount)}`,
                                label: h(
                                  TooltipTrigger,
                                  {
                                    content: invalidBillingAccount && invalidBillingAccountMsg,
                                    side: 'left',
                                  },
                                  [
                                    div({ style: { display: 'flex', alignItems: 'center' } }, [
                                      (cloudPlatform === 'GCP' || cloudPlatform === 'AZURE') &&
                                        h(CloudProviderIcon, {
                                          key: projectName,
                                          cloudProvider: cloudPlatform,
                                          style: { marginRight: '0.5rem' },
                                        }),
                                      projectName,
                                    ]),
                                  ]
                                ),
                                value: projectName,
                                isDisabled: invalidBillingAccount,
                              }),
                              _.sortBy('projectName', billingProjects)
                            ),
                          }),
                        ]),
                    ]),
                    isGoogleBillingProject() &&
                      h(IdContainer, [
                        (id) =>
                          h(Fragment, [
                            h(FormLabel, { htmlFor: id }, [
                              'Bucket location',
                              h(InfoBox, { style: { marginLeft: '0.25rem' } }, [
                                'A bucket location can only be set when creating a workspace. ',
                                'Once set, it cannot be changed. ',
                                'A cloned workspace will automatically inherit the bucket location from the original workspace but this may be changed at clone time.',
                                p([
                                  'By default, workflow and Cloud Environments will run in the same region as the workspace bucket. ',
                                  'Changing bucket or Cloud Environment locations from the defaults can lead to network egress charges.',
                                ]),
                                h(
                                  Link,
                                  {
                                    href: 'https://support.terra.bio/hc/en-us/articles/360058964552',
                                    ...Utils.newTabLinkProps,
                                  },
                                  ['Read more about bucket locations']
                                ),
                              ]),
                            ]),
                            h(Select as typeof Select<string>, {
                              id,
                              value: bucketLocation,
                              onChange: (opt) => setBucketLocation(opt!.value),
                              options: isAlphaRegionalityUser ? allRegions : availableBucketRegions,
                            }),
                          ]),
                      ]),
                    shouldShowDifferentRegionWarning() &&
                      div({ style: { ...warningStyle } }, [
                        icon('warning-standard', {
                          size: 24,
                          style: { color: colors.warning(), flex: 'none', marginRight: '0.5rem' },
                        }),
                        div({ style: { flex: 1 } }, [
                          'Copying data from ',
                          strong([getRegionInfo(sourceWorkspaceLocation, sourceLocationType).regionDescription]),
                          ' to ',
                          strong([getRegionInfo(bucketLocation, destLocationType).regionDescription]),
                          ' may incur network egress charges. ',
                          'To prevent charges, the new bucket location needs to stay in the same region as the original one. ',
                          h(
                            Link,
                            {
                              href: 'https://support.terra.bio/hc/en-us/articles/360058964552',
                              ...Utils.newTabLinkProps,
                            },
                            [
                              'For more information please read the documentation.',
                              icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } }),
                            ]
                          ),
                        ]),
                      ]),
                    h(IdContainer, [
                      (id) =>
                        h(Fragment, [
                          h(FormLabel, { htmlFor: id }, ['Description']),
                          h(TextArea, {
                            id,
                            style: { height: 100 },
                            placeholder: 'Enter a description',
                            value: description,
                            onChange: setDescription,
                          }),
                        ]),
                    ]),
                    isGoogleBillingProject() &&
                      div({ style: { margin: '1rem 0.25rem 0.25rem 0' } }, [
                        h(IdContainer, [
                          (id) =>
                            h(Fragment, [
                              h(
                                LabeledCheckbox,
                                {
                                  style: { marginRight: '0.25rem' },
                                  checked: enhancedBucketLogging,
                                  disabled: !!requireEnhancedBucketLogging || groups.length > 0,
                                  onChange: () => setEnhancedBucketLogging(!enhancedBucketLogging),
                                  'aria-describedby': id,
                                },
                                [
                                  label({ style: { ...Style.elements.sectionHeader } }, [
                                    'Enable additional security monitoring',
                                  ]),
                                ]
                              ),
                              h(InfoBox, { style: { marginLeft: '0.25rem', verticalAlign: 'middle' } }, [
                                protectedDataMessage,
                              ]),
                            ]),
                        ]),
                      ]),
                    isGoogleBillingProject() &&
                      h(IdContainer, [
                        (id) =>
                          h(Fragment, [
                            h(FormLabel, { htmlFor: id }, [
                              'Authorization domain (optional)',
                              h(InfoBox, { style: { marginLeft: '0.25rem' } }, [
                                'An authorization domain can only be set when creating a workspace. ',
                                'Once set, it cannot be changed. ',
                                'Any cloned workspace will automatically inherit the authorization domain(s) from the original workspace and cannot be removed. ',
                                h(
                                  Link,
                                  {
                                    href: 'https://support.terra.bio/hc/en-us/articles/360026775691',
                                    ...Utils.newTabLinkProps,
                                  },
                                  ['Read more about authorization domains']
                                ),
                              ]),
                            ]),
                            p({ style: { marginTop: '.25rem' } }, ['Additional group management controls']),
                            !!existingGroups.length &&
                              div({ style: { marginBottom: '0.5rem', fontSize: 12 } }, [
                                div({ style: { marginBottom: '0.2rem' } }, ['Inherited groups:']),
                                ...existingGroups.join(', '),
                              ]),
                            h(Select as typeof Select<string, true>, {
                              id,
                              isClearable: false,
                              isMulti: true,
                              placeholder: 'Select groups',
                              isDisabled: !allGroups || !billingProjects,
                              value: groups,
                              onChange: (data) => {
                                setGroups(_.map('value', data));
                                setEnhancedBucketLogging(!!requireEnhancedBucketLogging || data.length > 0);
                              },
                              options: _.difference(_.uniq(_.map('groupName', allGroups)), existingGroups).sort(),
                            }),
                          ]),
                      ]),
                    !!cloneWorkspace &&
                      isAzureWorkspace(cloneWorkspace) &&
                      h(WorkspacePolicies, {
                        workspace: cloneWorkspace,
                        title: 'Policies',
                        policiesLabel: 'The cloned workspace will inherit:',
                      }),
                    renderNotice({
                      selectedBillingProject: namespace
                        ? billingProjects?.find(({ projectName }) => projectName === namespace)
                        : undefined,
                    }),
                    workflowImport &&
                      azureBillingProjectsExist &&
                      div({ style: { paddingTop: '1.0rem', display: 'flex' } }, [
                        icon('info-circle', { size: 16, style: { marginRight: '0.5rem', color: colors.accent() } }),
                        div([
                          'Importing directly into new Azure workspaces is not currently supported. To create a new workspace with an Azure billing project, visit the main ',
                          h(
                            Link,
                            {
                              href: Nav.getLink('workspaces'),
                            },
                            ['Workspaces']
                          ),
                          ' page.',
                        ]),
                      ]),
                    isAzureBillingProject() &&
                      div({ style: { paddingTop: '1.0rem', display: 'flex' } }, [
                        icon('warning-standard', {
                          size: 16,
                          style: { marginRight: '0.5rem', color: colors.warning() },
                        }),
                        div([
                          'Creating a workspace may increase your infrastructure costs. ',
                          h(
                            Link,
                            {
                              href: 'https://support.terra.bio/hc/en-us/articles/12029087819291',
                              ...Utils.newTabLinkProps,
                            },
                            [
                              'Learn more and follow changes',
                              icon('pop-out', { size: 14, style: { marginLeft: '0.25rem' } }),
                            ]
                          ),
                        ]),
                      ]),
                    createError &&
                      div(
                        {
                          style: { marginTop: '1rem', color: colors.danger() },
                        },
                        [createError]
                      ),
                  ]),
            ]
          ),
      ],
      () =>
        h(
          Modal,
          {
            title: 'Set Up Billing',
            onDismiss,
            okButton: h(
              ButtonPrimary,
              {
                onClick: () => Nav.goToPath('billing'),
              },
              ['Go to Billing']
            ),
          },
          [
            div([
              icon('error-standard', { size: 16, style: { marginRight: '0.5rem', color: colors.warning() } }),
              getNoApplicableBillingProjectsMessage(),
            ]),
          ]
        )
    );
  }
);

export default NewWorkspaceModal;
