import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { div, h, label, p, strong } from 'react-hyperscript-helpers';
import { cloudProviders, defaultLocation } from 'src/analysis/utils/runtime-utils';
import { CloudProviderIcon } from 'src/components/CloudProviderIcon';
import { ButtonPrimary, IdContainer, LabeledCheckbox, Link, Select, spinnerOverlay } from 'src/components/common';
import { icon } from 'src/components/icons';
import { TextArea, ValidatedInput } from 'src/components/input';
import Modal from 'src/components/Modal';
import { InfoBox } from 'src/components/PopupTrigger';
import {
  allRegions,
  availableBucketRegions,
  getLocationType,
  getRegionInfo,
  isLocationMultiRegion,
  isSupportedBucketLocation,
} from 'src/components/region-common';
import TooltipTrigger from 'src/components/TooltipTrigger';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { getConfig } from 'src/libs/config';
import { reportErrorAndRethrow, withErrorReporting } from 'src/libs/error';
import Events, { extractCrossWorkspaceDetails, extractWorkspaceDetails } from 'src/libs/events';
import { FormLabel } from 'src/libs/forms';
import * as Nav from 'src/libs/nav';
import { useCancellation, useOnMount, withDisplayName } from 'src/libs/react-utils';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { cloudProviderLabels, isAzureWorkspace, isGoogleWorkspace } from 'src/libs/workspace-utils';
import validate from 'validate.js';

const warningStyle = {
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

const invalidBillingAccountMsg = 'Workspaces may only be created in billing projects that have a Google billing account accessible in Terra';

const ariaInvalidBillingAccountMsg = (invalidBillingAccount) => {
  return invalidBillingAccount ? ` with warning "${invalidBillingAccountMsg}"` : '';
};

const NewWorkspaceModal = withDisplayName(
  'NewWorkspaceModal',
  ({ cloneWorkspace, onSuccess, onDismiss, customMessage, requiredAuthDomain, requireEnhancedBucketLogging, title, buttonText, workflowImport }) => {
    // State
    const [billingProjects, setBillingProjects] = useState();
    const [azureBillingProjectsExist, setAzureBillingProjectsExist] = useState(false);
    const [allGroups, setAllGroups] = useState();
    const [name, setName] = useState(cloneWorkspace ? `${cloneWorkspace.workspace.name} copy` : '');
    const [namespace, setNamespace] = useState(cloneWorkspace ? cloneWorkspace.workspace.namespace : undefined);
    const [description, setDescription] = useState(cloneWorkspace ? cloneWorkspace.workspace.attributes.description : '');
    const [groups, setGroups] = useState([]);
    const [enhancedBucketLogging, setEnhancedBucketLogging] = useState(!!requireEnhancedBucketLogging);
    const [nameModified, setNameModified] = useState(false);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState();
    const [bucketLocation, setBucketLocation] = useState(defaultLocation);
    const [sourceWorkspaceLocation, setSourceWorkspaceLocation] = useState(defaultLocation);
    const [isAlphaRegionalityUser, setIsAlphaRegionalityUser] = useState(false);
    const signal = useCancellation();

    // Helpers
    const getRequiredGroups = () =>
      _.uniq([
        ...(cloneWorkspace ? _.map('membersGroupName', cloneWorkspace.workspace.authorizationDomain) : []),
        ...(requiredAuthDomain ? [requiredAuthDomain] : []),
      ]);

    const loadAlphaRegionalityUser = reportErrorAndRethrow('Error loading regionality group membership')(async () => {
      setIsAlphaRegionalityUser(await Ajax(signal).Groups.group(getConfig().alphaRegionalityGroup).isMember());
    });

    const create = async () => {
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
            cloneWorkspace,
            async () => {
              const workspace = await Ajax().Workspaces.workspace(cloneWorkspace.workspace.namespace, cloneWorkspace.workspace.name).clone(body);
              const featuredList = await Ajax().FirecloudBucket.getFeaturedWorkspaces();
              Ajax().Metrics.captureEvent(Events.workspaceClone, {
                featured: _.some({ namespace: cloneWorkspace.workspace.namespace, name: cloneWorkspace.workspace.name }, featuredList),
                ...extractCrossWorkspaceDetails(cloneWorkspace, {
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

        onSuccess(createdWorkspace);
      } catch (error) {
        const { message } = await error.json();
        setCreating(false);
        setCreateError(message);
      }
    };

    const loadData = _.flow(
      withErrorReporting('Error loading data'),
      Utils.withBusyState(setLoading)
    )(() =>
      Promise.all([
        Ajax(signal)
          .Billing.listProjects()
          .then(_.filter({ status: 'Ready' }))
          .then(
            _.forEach((project) => {
              if (isAzureBillingProject(project)) {
                setAzureBillingProjectsExist(true);
              }
            })
          )
          .then(_.filter((project) => isBillingProjectApplicable(project)))
          .then((projects) => {
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

    const isAzureBillingProject = (project) => isCloudProviderBillingProject(project, cloudProviders.azure.label);

    const isGoogleBillingProject = (project) => isCloudProviderBillingProject(project, cloudProviders.gcp.label);

    const isCloudProviderBillingProject = (project, cloudProvider) => getProjectCloudPlatform(project) === cloudProvider;

    const getProjectCloudPlatform = (project) => {
      if (project === undefined) {
        project = _.find({ projectName: namespace }, billingProjects);
      }
      return project?.cloudPlatform;
    };

    const isBillingProjectApplicable = (project) => {
      // Only support cloning a workspace to the same cloud environment. If this changes, also update
      // the Events.workspaceClone event data.
      // As of AJ-1164, if requireEnhancedBucketLogging is true, then azure billing projects are ineligible.
      // This coupling of enhanced bucket logging and billing project may change in the future.
      return Utils.cond(
        [!!workflowImport || requireEnhancedBucketLogging, () => !isAzureBillingProject(project)],
        [!!cloneWorkspace && isAzureWorkspace(cloneWorkspace), () => isAzureBillingProject(project)],
        [!!cloneWorkspace && isGoogleWorkspace(cloneWorkspace), () => isGoogleBillingProject(project)],
        [Utils.DEFAULT, () => true]
      );
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

    return Utils.cond(
      [loading || billingProjects === undefined, () => spinnerOverlay],
      [
        hasBillingProjects,
        () =>
          h(
            Modal,
            {
              title: Utils.cond([title, () => title], [cloneWorkspace, () => 'Clone this workspace'], () => 'Create a New Workspace'),
              onDismiss,
              okButton: h(
                ButtonPrimary,
                {
                  disabled: errors,
                  tooltip: Utils.summarizeErrors(errors),
                  onClick: create,
                },
                Utils.cond([buttonText, () => buttonText], [cloneWorkspace, () => 'Clone Workspace'], () => 'Create Workspace')
              ),
            },
            [
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
                    h(Select, {
                      id,
                      isClearable: false,
                      placeholder: 'Select a billing project',
                      value: namespace,
                      ariaLiveMessages: { onFocus: onFocusAria, onChange: onChangeAria },
                      onChange: ({ value }) => setNamespace(value),
                      styles: { option: (provided) => ({ ...provided, padding: 10 }) },
                      options: _.map(
                        ({ projectName, invalidBillingAccount, cloudPlatform }) => ({
                          'aria-label': `${cloudProviderLabels[cloudPlatform]} ${projectName}${ariaInvalidBillingAccountMsg(invalidBillingAccount)}`,
                          label: h(
                            TooltipTrigger,
                            {
                              content: invalidBillingAccount && invalidBillingAccountMsg,
                              side: 'left',
                            },
                            [
                              div({ style: { display: 'flex', alignItems: 'center' } }, [
                                h(CloudProviderIcon, { key: projectName, cloudProvider: cloudPlatform, style: { marginRight: '0.5rem' } }),
                                projectName,
                              ]),
                            ]
                          ),
                          value: projectName,
                          isDisabled: invalidBillingAccount,
                        }),
                        _.sortBy('projectName', _.uniq(billingProjects))
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
                      h(Select, {
                        id,
                        value: bucketLocation,
                        onChange: ({ value }) => setBucketLocation(value),
                        options: isAlphaRegionalityUser ? allRegions : availableBucketRegions,
                      }),
                    ]),
                ]),
              isLocationMultiRegion(bucketLocation) &&
                div({ style: { ...warningStyle } }, [
                  icon('warning-standard', { size: 24, style: { color: colors.warning(), flex: 'none', marginRight: '0.5rem' } }),
                  div({ style: { flex: 1 } }, [
                    'Effective October 1, 2022, Google Cloud will charge egress fees on data stored in multi-region storage buckets.',
                    p('Choosing a multi-region bucket location may result in additional storage costs for your workspace.'),
                    p([
                      'Unless you require geo-redundancy for maximum availabity for your data, you should choose a single region bucket location.',
                      h(Link, { href: 'https://terra.bio/moving-away-from-multi-regional-storage-buckets', ...Utils.newTabLinkProps }, [
                        ' For more information see this blog post.',
                        icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } }),
                      ]),
                    ]),
                  ]),
                ]),
              shouldShowDifferentRegionWarning() &&
                div({ style: { ...warningStyle } }, [
                  icon('warning-standard', { size: 24, style: { color: colors.warning(), flex: 'none', marginRight: '0.5rem' } }),
                  div({ style: { flex: 1 } }, [
                    'Copying data from ',
                    strong([getRegionInfo(sourceWorkspaceLocation, sourceLocationType).regionDescription]),
                    ' to ',
                    strong([getRegionInfo(bucketLocation, destLocationType).regionDescription]),
                    ' may incur network egress charges. ',
                    'To prevent charges, the new bucket location needs to stay in the same region as the original one. ',
                    h(Link, { href: 'https://support.terra.bio/hc/en-us/articles/360058964552', ...Utils.newTabLinkProps }, [
                      'For more information please read the documentation.',
                      icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } }),
                    ]),
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
                  h(
                    LabeledCheckbox,
                    {
                      style: { margin: '0rem 0.25rem 0.25rem 0' },
                      checked: enhancedBucketLogging,
                      disabled: !!requireEnhancedBucketLogging || groups.length > 0,
                      onChange: () => setEnhancedBucketLogging(!enhancedBucketLogging),
                    },
                    [label({ style: { ...Style.elements.sectionHeader } }, ['Enhanced Bucket Logging'])]
                  ),
                  h(InfoBox, { style: { marginLeft: '0.25rem', verticalAlign: 'middle' } }, [
                    'Enabling Enhanced Bucket Logging tells the Terra to log all data access requests to the workspace bucket. ' +
                      'This feature is automatically enabled when a workspace is created with Authorization Domains.',
                  ]),
                ]),
              isGoogleBillingProject() &&
                h(IdContainer, [
                  (id) =>
                    h(Fragment, [
                      h(FormLabel, { htmlFor: id }, [
                        'Authorization domain',
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
                      !!existingGroups.length &&
                        div({ style: { marginBottom: '0.5rem', fontSize: 12 } }, [
                          div({ style: { marginBottom: '0.2rem' } }, ['Inherited groups:']),
                          ...existingGroups.join(', '),
                        ]),
                      h(Select, {
                        id,
                        isClearable: false,
                        isMulti: true,
                        placeholder: 'Select groups',
                        disabled: !allGroups || !billingProjects,
                        value: groups,
                        onChange: (data) => {
                          setGroups(_.map('value', data));
                          setEnhancedBucketLogging(data.length > 0);
                        },
                        options: _.difference(_.uniq(_.map('groupName', allGroups)), existingGroups).sort(),
                      }),
                    ]),
                ]),
              customMessage && div({ style: { marginTop: '1rem', lineHeight: '1.5rem' } }, [customMessage]),
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
                  icon('warning-standard', { size: 16, style: { marginRight: '0.5rem', color: colors.warning() } }),
                  div([
                    'Creating a workspace currently costs about $5 per day. ',
                    h(
                      Link,
                      {
                        href: 'https://support.terra.bio/hc/en-us/articles/12029087819291',
                        ...Utils.newTabLinkProps,
                      },
                      ['Learn more and follow changes', icon('pop-out', { size: 14, style: { marginLeft: '0.25rem' } })]
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
              creating && spinnerOverlay,
            ]
          ),
      ],
      () =>
        h(
          Modal,
          {
            title: 'Set up Billing',
            onDismiss,
            showCancel: false,
            okButton: h(
              ButtonPrimary,
              {
                onClick: () => Nav.goToPath('billing'),
              },
              'Go to Billing'
            ),
          },
          [
            div([
              icon('error-standard', { size: 16, style: { marginRight: '0.5rem', color: colors.warning() } }),
              'You need a billing project to ',
              cloneWorkspace ? 'clone a' : 'create a new',
              ' workspace.',
            ]),
          ]
        )
    );
  }
);

export default NewWorkspaceModal;
