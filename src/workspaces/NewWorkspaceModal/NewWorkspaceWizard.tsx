import { ButtonSecondary, Icon, Modal, modalStyles, Switch, TooltipTrigger } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { ReactNode, useState } from 'react';
import { defaultLocation } from 'src/analysis/utils/runtime-utils';
import { validateUserEmails } from 'src/billing/utils';
import { BillingProject, CloudPlatform, GCPBillingProject } from 'src/billing-core/models';
import { CloudProviderIcon } from 'src/components/CloudProviderIcon';
import { ButtonPrimary, IdContainer, Link, Select, spinnerOverlay, VirtualizedSelect } from 'src/components/common';
import { InfoBox } from 'src/components/InfoBox';
import { TextArea, ValidatedInput } from 'src/components/input';
import { allRegions, availableBucketRegions, isSupportedBucketLocation } from 'src/components/region-common';
import { TabWizard } from 'src/components/tabWizard';
import { EmailSelect } from 'src/groups/Members/EmailSelect';
import { Billing } from 'src/libs/ajax/billing/Billing';
import { FirecloudBucket } from 'src/libs/ajax/firecloud/FirecloudBucket';
import { CurrentUserGroupMembership, Groups } from 'src/libs/ajax/Groups';
import { Metrics } from 'src/libs/ajax/Metrics';
import { Workspaces } from 'src/libs/ajax/workspaces/Workspaces';
import colors from 'src/libs/colors';
import { getConfig } from 'src/libs/config';
import { reportErrorAndRethrow, withErrorReportingInModal } from 'src/libs/error';
import Events, { extractCrossWorkspaceDetails, extractWorkspaceDetails } from 'src/libs/events';
import { FormLabel } from 'src/libs/forms';
import * as Nav from 'src/libs/nav';
import { useCancellation, useOnMount, withDisplayName } from 'src/libs/react-utils';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { append, summarizeErrors } from 'src/libs/utils';
import { CloneEgressWarning } from 'src/workspaces/NewWorkspaceModal/CloneEgressWarning';
import { CreatingWorkspaceMessage } from 'src/workspaces/NewWorkspaceModal/CreatingWorkspaceMessage';
import {
  cloudProviderLabels,
  isGoogleWorkspace,
  isProtectedWorkspace,
  WorkspaceInfo,
  WorkspaceWrapper,
} from 'src/workspaces/utils';
import validate from 'validate.js';

import { AccessEntry, WorkspaceAcl } from '../acl-utils';
import { AclInput } from '../ShareWorkspaceModal/Collaborator';
import { CurrentCollaborators } from '../ShareWorkspaceModal/CurrentCollaborators';

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

export interface NewWorkspaceWizardProps {
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

export const NewWorkspaceWizard = withDisplayName(
  'NewWorkspaceWizard',
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
    workflowImport,
  }: NewWorkspaceWizardProps) => {
    // State
    const [billingProjects, setBillingProjects] = useState<BillingProject[]>();
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
    const [sourceGCPWorkspaceRegion, setSourceGcpWorkspaceRegion] = useState<string>(defaultLocation);
    const [sourceGCPWorkspaceRegionError, setSourceGCPWorkspaceRegionError] = useState(false);
    const [isAlphaRegionalityUser, setIsAlphaRegionalityUser] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('basic');
    const signal = useCancellation();

    // Helpers
    const getRequiredGroups = (): string[] =>
      _.uniq([
        ...(cloneWorkspace ? _.map('membersGroupName', cloneWorkspace.workspace.authorizationDomain) : []),
        ...(requiredAuthDomain ? [requiredAuthDomain] : []),
      ]);

    const loadAlphaRegionalityUser = reportErrorAndRethrow('Error loading regionality group membership')(async () => {
      setIsAlphaRegionalityUser(await Groups(signal).group(getConfig().alphaRegionalityGroup).isMember());
    });

    const create = async (): Promise<void> => {
      try {
        setCreateError(undefined);
        setCreating(true);

        const body = {
          namespace: namespace!,
          name,
          authorizationDomain: _.map((v) => ({ membersGroupName: v }), [...getRequiredGroups(), ...groups]),
          attributes: { description },
          copyFilesWithPrefix: isGoogleBillingProject() ? 'notebooks/' : 'analyses/',
          ...(!!bucketLocation && isGoogleBillingProject() && { bucketLocation }),
          enhancedBucketLogging,
          addUsers: acl,
        };

        const createdWorkspace = await Utils.cond(
          [
            !!cloneWorkspace,
            async () => {
              const workspace: WorkspaceInfo = await Workspaces()
                .workspaceV2(cloneWorkspace!.workspace.namespace, cloneWorkspace!.workspace.name)
                .clone(body);
              const featuredList = await FirecloudBucket().getFeaturedWorkspaces();
              const metricsData = {
                featured: _.some(
                  { namespace: cloneWorkspace!.workspace.namespace, name: cloneWorkspace!.workspace.name },
                  featuredList
                ),
                ...extractCrossWorkspaceDetails(cloneWorkspace!, { workspace }),
                fromWorkspaceRegion: sourceGCPWorkspaceRegion,
                toWorkspaceRegion: bucketLocation,
              };
              void Metrics().captureEvent(Events.workspaceClone, metricsData);
              return workspace;
            },
          ],
          async () => {
            const workspace = await Workspaces().create(body);
            const metricsData = {
              ...extractWorkspaceDetails(workspace),
              region: bucketLocation,
            };
            void Metrics().captureEvent(Events.workspaceCreate, metricsData);
            return workspace;
          }
        );

        onSuccess(createdWorkspace);
      } catch (error: unknown) {
        const errorMessage = await (async () => {
          if (error instanceof Response) {
            try {
              const { message } = await error.json();
              return message || 'Unknown error.';
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
        Billing(signal)
          .listProjects()
          .then(_.filter({ status: 'Ready' }))
          .then(_.filter((project: BillingProject) => isBillingProjectApplicable(project)))
          .then((projects: BillingProject[]) => {
            setBillingProjects(projects);
            setNamespace(_.some({ projectName: namespace }, projects) ? namespace : undefined);
          }),
        Groups(signal).list().then(setAllGroups),
        !!cloneWorkspace &&
          Workspaces(signal)
            .workspace(namespace!, cloneWorkspace.workspace.name)
            .details(['workspace.attributes.description'])
            .then((workspace) => {
              setDescription(workspace.workspace.attributes?.description || '');
            }),
        !!cloneWorkspace &&
          isGoogleWorkspace(cloneWorkspace) &&
          Workspaces(signal)
            .workspace(namespace!, cloneWorkspace.workspace.name)
            .checkBucketLocation()
            .then(({ location }) => {
              // For current phased regionality release, we only allow US workspace buckets.
              setBucketLocation(isSupportedBucketLocation(location) ? location : defaultLocation);
              setSourceGcpWorkspaceRegion(location);
            })
            .catch((_) => {
              // We cannot get the bucket location in a couple of scenarios:
              // 1. The bucket is requester pays.
              // 2. The user permissions are still syncing.
              // In either case, we will just show a generic egress warning message to prevent the
              // user from being blocked from cloning the workspace.
              setSourceGCPWorkspaceRegionError(true);
              console.log('Error getting the source workspace bucket location'); // eslint-disable-line no-console
            }),
      ])
    );

    const isGoogleBillingProject = (project?: BillingProject): project is GCPBillingProject =>
      isCloudProviderBillingProject(project, 'GCP');

    const isCloudProviderBillingProject = (
      project: BillingProject | undefined,
      cloudProvider: CloudPlatform
    ): boolean => getProjectCloudPlatform(project) === cloudProvider;

    const selectedBillingProject: BillingProject | undefined = namespace
      ? billingProjects?.find(({ projectName }) => projectName === namespace)
      : undefined;

    const getProjectCloudPlatform = (project?: BillingProject): CloudPlatform | undefined => {
      if (project === undefined) {
        project = selectedBillingProject;
      }
      return project?.cloudPlatform;
    };

    const isBillingProjectApplicable = (project: BillingProject): boolean => {
      // This is used when importing data to enforce a specific cloud.
      if (cloudPlatform && project.cloudPlatform !== cloudPlatform) {
        return false;
      }
      if (workflowImport) {
        return true;
      }

      if (!!cloneWorkspace && isGoogleWorkspace(cloneWorkspace)) {
        return isGoogleBillingProject(project);
      }
      return true;
    };

    const cloningGcpProtectedWorkspace =
      !!cloneWorkspace && isGoogleWorkspace(cloneWorkspace) && isProtectedWorkspace(cloneWorkspace);

    // Lifecycle
    useOnMount(() => {
      // If cloning a GCP protected workspace, override whatever may have been passed via `requireEnhancedBucketLogging`
      if (cloningGcpProtectedWorkspace) {
        setEnhancedBucketLogging(true);
      }
      loadData();
      loadAlphaRegionalityUser();
    });

    // Render
    const existingGroups = getRequiredGroups();
    const hasBillingProjects = !!billingProjects && !!billingProjects.length;
    const errors = validate({ namespace, name }, constraints, {
      prettify: (v) => ({ namespace: 'Billing project', name: 'Name' }[v] || validate.prettify(v)),
    });

    const onFocusAria = ({ focused, isDisabled }) => {
      return `${isDisabled ? 'Disabled option ' : 'Option '}${focused['aria-label']}, focused.`;
    };

    const onChangeAria = ({ value }) => {
      return !value ? '' : `Option ${value['aria-label']} selected.`;
    };

    const endingNotice = renderNotice ? renderNotice({ selectedBillingProject }) : undefined;

    const renderPolicyAndWorkspaceInfo = () => {
      // if (isAzureBillingProject() || (!!cloneWorkspace && isAzureWorkspace(cloneWorkspace))) {
      //   const workspacePoliciesProps: WorkspacePoliciesProps = {
      //     workspace: cloneWorkspace,
      //     billingProject: selectedBillingProject,
      //     endingNotice: (
      //       <div>
      //         {endingNotice}
      //         <div
      //           style={{
      //             display: 'grid',
      //             gridTemplateColumns: 'auto auto',
      //             fontWeight: 600,
      //             paddingTop: endingNotice ? '1.0rem' : 0,
      //           }}
      //         >
      //           <Icon icon='warning-standard' size={18} style={{ marginRight: '0.5rem', color: colors.warning() }} />
      //           <div>
      //             Creating a workspace may increase your infrastructure costs
      //             <LinkWithPopout href='https://support.terra.bio/hc/en-us/articles/12029087819291'>
      //               Learn more about cost and follow changes
      //             </LinkWithPopout>
      //             ,
      //           </div>
      //         </div>
      //       </div>
      //     ),
      //   };
      //   // Allow toggling PHI tracking if:
      //   // 1. Creating a new workspace and the billing project supports PHI tracking.
      //   // 2. Cloning a workspace without PHI tracking to a billing project that supports PHI tracking.
      //   // Note: when cloning a workspace with PHI tracking already enabled, the policy is inherited and cannot be changed
      //   if (
      //     !!selectedBillingProject &&
      //     supportsPhiTracking(selectedBillingProject) &&
      //     (!cloneWorkspace || !hasPhiTrackingPolicy(cloneWorkspace))
      //   ) {
      //     workspacePoliciesProps.onTogglePhiTracking = (selected: boolean) => setPhiTracking(selected);
      //     workspacePoliciesProps.togglePhiTrackingChecked = phiTracking;
      //   }
      //   return <WorkspacePolicies {...workspacePoliciesProps} />;
      // }

      // If we display the Azure policy/workspace section, we render the optional notice within that block
      return endingNotice ? <div style={{ ...Style.elements.noticeContainer }}>{endingNotice}</div> : undefined;
    };

    const basicTab = (
      <>
        <IdContainer>
          {(id) => (
            <>
              <FormLabel htmlFor={id} required>
                Workspace name
              </FormLabel>
              <ValidatedInput
                inputProps={{
                  id,
                  autoFocus: true,
                  placeholder: 'Enter a name',
                  value: name,
                  onChange: (v) => {
                    setName(v);
                    setNameModified(true);
                  },
                }}
                error={Utils.summarizeErrors(nameModified && errors?.name)}
              />
            </>
          )}
        </IdContainer>
        <IdContainer>
          {(id) => (
            <>
              <FormLabel htmlFor={id}>Description</FormLabel>
              <TextArea
                id={id}
                style={{ height: 100 }}
                placeholder='Enter a description'
                value={description}
                onChange={setDescription}
              />
            </>
          )}
        </IdContainer>
        <IdContainer>
          {(id) => (
            <>
              <FormLabel htmlFor={id} required>
                Billing project
              </FormLabel>
              <VirtualizedSelect
                id={id}
                isClearable={false}
                placeholder='Select a billing project'
                value={namespace || null}
                ariaLiveMessages={{ onFocus: onFocusAria, onChange: onChangeAria }}
                onChange={(opt) => setNamespace(opt!.value)}
                styles={{ option: (provided) => ({ ...provided, padding: 10 }) }}
                options={_.map((project: BillingProject) => {
                  const { projectName, invalidBillingAccount, cloudPlatform } = project;
                  return {
                    'aria-label': `${cloudProviderLabels[cloudPlatform]} ${projectName}${ariaInvalidBillingAccountMsg(
                      invalidBillingAccount
                    )}`,
                    label: (
                      <TooltipTrigger content={invalidBillingAccount && invalidBillingAccountMsg} side='left'>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {cloudPlatform === 'GCP' && (
                            <CloudProviderIcon
                              key={projectName}
                              cloudProvider={cloudPlatform}
                              style={{ marginRight: '0.5rem' }}
                            />
                          )}
                          {projectName}
                        </div>
                      </TooltipTrigger>
                    ),
                    value: projectName,
                    isDisabled: invalidBillingAccount,
                  };
                }, _.sortBy('projectName', billingProjects))}
              />
            </>
          )}
        </IdContainer>
        {isGoogleBillingProject() && (
          <IdContainer>
            {(id) => (
              <>
                <FormLabel htmlFor={id}>
                  Bucket location
                  <InfoBox style={{ marginLeft: '0.25rem' }}>
                    <p style={{ marginTop: '0.2rem' }}>
                      By default, workflow and Cloud Environments will run in the same region as the workspace bucket.
                      Changing bucket or Cloud Environment locations from the defaults can lead to network egress
                      charges.
                    </p>
                    <Link href='https://support.terra.bio/hc/en-us/articles/360058964552' {...Utils.newTabLinkProps}>
                      Read more about bucket locations
                    </Link>
                  </InfoBox>
                </FormLabel>
                <Select<string>
                  isDisabled
                  id={id}
                  value={bucketLocation}
                  onChange={(opt) => setBucketLocation(opt!.value)}
                  options={isAlphaRegionalityUser ? allRegions : availableBucketRegions}
                />
              </>
            )}
          </IdContainer>
        )}
      </>
    );

    /** ******************** */
    // TODO more intelligently share this with ShareWorkspaceModal.tsx

    const defaultAcl: AccessEntry = {
      email: '',
      accessLevel: 'READER',
      pending: false,
      canShare: false,
      canCompute: false,
    };

    // State
    const [searchValues, setSearchValues] = useState<string[]>([]);
    const [acl, setAcl] = useState<WorkspaceAcl>([]);
    const [newAcl, setNewAcl] = useState<AccessEntry>(defaultAcl);
    const [lastAddedEmail, setLastAddedEmail] = useState<string | undefined>(undefined);

    // // Render
    const sharingErrors = validateUserEmails(searchValues);
    const aclEmails = _.map('email', acl);

    const addCollaborators = (collaboratorEmails: string[], collaboratorAcl: AccessEntry) => {
      collaboratorEmails.forEach((collaboratorEmail: string) => {
        if (!validate.single(collaboratorEmail, { email: true, exclusion: aclEmails })) {
          setAcl(append({ ...collaboratorAcl, email: collaboratorEmail } as AccessEntry));
          setLastAddedEmail(collaboratorEmail);
        }
      });
      // Clear the search values and new acl after adding collaborators
      setSearchValues([]);
      setNewAcl(defaultAcl);
    };

    const sharingTab = (
      <>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
          <div style={{ flexGrow: 100, alignSelf: 'flex-start' }}>
            <EmailSelect
              placeholder='Add people or groups'
              options={[]}
              emails={searchValues}
              setEmails={setSearchValues}
            />
          </div>

          <div style={{ flexGrow: 1, alignSelf: 'flex-start' }}>
            <FormLabel id='aclInputId' style={{ marginTop: '0.25rem' }}>
              Permissions
            </FormLabel>
            <AclInput
              aria-label='permissions for new collaborator'
              value={newAcl}
              onChange={setNewAcl}
              disabled={false}
              maxAccessLevel='OWNER' // presumably since we're creating the workspace
              isAzureWorkspace={false}
              showRow={false}
            />
          </div>
          <div style={{ flexGrow: 1, alignSelf: 'flex-start', marginTop: '1.65rem' }}>
            <ButtonPrimary
              disabled={!!sharingErrors}
              tooltip={summarizeErrors(sharingErrors)}
              onClick={() => addCollaborators(searchValues, newAcl)}
            >
              Add
            </ButtonPrimary>
          </div>
        </div>
        <CurrentCollaborators
          acl={acl}
          setAcl={setAcl}
          originalAcl={acl}
          lastAddedEmail={lastAddedEmail}
          workspaceAccessLevel='OWNER'
          isAzureWorkspace={false}
          listStyles={{ margin: '0.5rem 0rem 0px' }}
        />
      </>
    );

    /** *************************** */

    const securityTab = (
      <>
        <div style={{ margin: '1rem 0.25rem 0.25rem 0' }}>
          <IdContainer>
            {(id) => (
              <>
                <FormLabel htmlFor={id}>Additional Security Options</FormLabel>
                <p style={{ marginTop: '.25rem' }}>
                  In order to ensure that only authorized Terra Users get access to a User’s Workspace you must select
                  these options:
                </p>
              </>
            )}
          </IdContainer>
          <IdContainer>
            {(id) => (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  outline: 'solid',
                  borderRadius: '5px',
                  columnGap: '5%',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '80%',
                    justifyContent: 'space-between',
                    padding: '1rem',
                  }}
                >
                  <FormLabel htmlFor={id}>Enable Secure Monitoring</FormLabel>
                  <p style={{ padding: '0.1rem' }}>
                    Enhanced logging and monitoring are enabled to support the use of controlled-access data in this
                    workspace.
                  </p>
                </div>
                <div style={{ marginTop: '0.5rem', alignSelf: 'right', display: 'flex', alignItems: 'center' }}>
                  <Switch
                    onLabel=''
                    offLabel=''
                    onChange={() => {
                      setEnhancedBucketLogging(!enhancedBucketLogging);
                    }}
                    checked={enhancedBucketLogging}
                    width={40}
                    height={20}
                  />
                </div>
              </div>
            )}
          </IdContainer>
        </div>
        <IdContainer>
          {(id) => (
            <>
              <FormLabel htmlFor={id}>Authorization Domain</FormLabel>
              <p style={{ marginLeft: '0.25rem' }}>
                Authorization Domains restrict data access to only specified individuals in a group and are intended to
                fulfill requirements you may have for data governed by a compliance standard, such as federal
                controlled-access data or HIPAA protected data. They follow all workspace copies and cannot be removed.
                <p>
                  For more details, see{' '}
                  <Link href='https://support.terra.bio/hc/en-us/articles/360026775691' {...Utils.newTabLinkProps}>
                    When to use an Authorization Domain
                  </Link>
                  .
                </p>
              </p>
              {!!existingGroups.length && (
                <div style={{ marginBottom: '0.5rem', fontSize: 12 }}>
                  <div style={{ marginBottom: '0.2rem' }}>Inherited groups:</div>
                  {existingGroups.join(', ')}
                </div>
              )}
              <Select<string, true>
                id={id}
                isClearable={false}
                isMulti
                placeholder='Select groups'
                isDisabled={!allGroups || !billingProjects}
                value={groups}
                onChange={(data) => {
                  setGroups(_.map('value', data));
                  setEnhancedBucketLogging(!!requireEnhancedBucketLogging || data.length > 0);
                }}
                options={_.difference(_.uniq(_.map('groupName', allGroups)), existingGroups).sort()}
              />
            </>
          )}
        </IdContainer>
        {renderPolicyAndWorkspaceInfo()}
      </>
    );

    // TODO can i do this prettier with Utils.cond?
    const handleSecondaryButtonClick = async () => {
      if (activeTab === 'basic') {
        await create();
      } else if (activeTab === 'sharing') {
        setActiveTab('basic');
      } else if (activeTab === 'security') {
        setActiveTab('sharing');
      }
    };

    const handlePrimaryButtonClick = async () => {
      if (activeTab === 'basic') {
        setActiveTab('sharing');
      } else if (activeTab === 'sharing') {
        setActiveTab('security');
      } else if (activeTab === 'security') {
        await create();
      }
    };

    const buttons = (
      <div
        style={{
          padding: '-1 -1 rem',
          width: '90%',
          position: 'absolute',
          bottom: '1rem',
          ...modalStyles.buttonRow,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <ButtonSecondary style={{ position: 'absolute', left: '1rem' }} onClick={onDismiss}>
          Cancel
        </ButtonSecondary>
        <div style={{ display: 'flex', gap: '1rem', padding: '0 1rem', marginLeft: '1rem' }}>
          <ButtonSecondary
            style={{ padding: '0 1rem', marginLeft: '1rem', border: '1px solid', borderRadius: '5px' }}
            disabled={activeTab === 'basic' && errors}
            tooltip={
              activeTab === 'basic'
                ? 'Allows you to quickly create workspace without any sharing or additional security options'
                : undefined
            } // TODO should i summarize errors if there are any?  And then not show the tooltip?
            onClick={handleSecondaryButtonClick}
          >
            {Utils.cond([activeTab === 'basic', () => 'Quick create workspace'], () => 'Previous')}
          </ButtonSecondary>
          <ButtonPrimary
            style={{ padding: '0 1rem', marginLeft: '1rem' }}
            disabled={activeTab === 'security' && errors}
            tooltip={activeTab === 'security' ? Utils.summarizeErrors(errors) : undefined}
            onClick={handlePrimaryButtonClick}
          >
            {Utils.cond([activeTab === 'security', () => 'Create workspace'], () => 'Next')}
          </ButtonPrimary>
        </div>
      </div>
    );

    return Utils.cond(
      [loading, () => spinnerOverlay],
      [
        hasBillingProjects,
        () => (
          <Modal
            title={Utils.cond(
              [!!title, () => title],
              [!!cloneWorkspace && creating, () => 'Cloning workspace'],
              [creating, () => 'Creating workspace'],
              [!!cloneWorkspace, () => 'Clone Workspace'],
              () => 'Create a New Workspace'
            )}
            // Hold modal open while waiting for create workspace request.
            shouldCloseOnOverlayClick={!creating}
            shouldCloseOnEsc={!creating}
            showButtons={false}
            onDismiss={onDismiss}
            okButton={
              <ButtonPrimary disabled={errors} tooltip={Utils.summarizeErrors(errors)} onClick={create}>
                {Utils.cond(
                  [!!buttonText, () => buttonText],
                  [!!cloneWorkspace, () => 'Clone Workspace'],
                  () => 'Create Workspace'
                )}
              </ButtonPrimary>
            }
            width={620}
            styles={{ modal: { height: 650 } }}
          >
            {creating ? (
              <CreatingWorkspaceMessage />
            ) : (
              <>
                <TabWizard
                  aria-label='create workspace wizard'
                  activeTab={activeTab}
                  tabNames={['basic', 'sharing', 'security']}
                  displayNames={{
                    basic: '1. Basic Information and Billing',
                    sharing: '2. Sharing',
                    security: '3. Additional Security Options',
                  }}
                  style={{ textTransform: 'none', width: '90%' }}
                  getHref={() => {}}
                  getOnClick={(currentTab) => (e) => {
                    e.preventDefault();
                    setActiveTab(currentTab);
                  }}
                >
                  {null /* nothing to display at the end of the tab bar */}
                </TabWizard>
                {activeTab === 'basic' && basicTab}
                {activeTab === 'sharing' && sharingTab}
                {activeTab === 'security' && securityTab}

                {!!selectedBillingProject && !!cloneWorkspace && activeTab === 'basic' && (
                  <CloneEgressWarning
                    sourceWorkspace={cloneWorkspace}
                    sourceAzureWorkspaceRegion=''
                    selectedBillingProject={selectedBillingProject}
                    selectedGcpBucketLocation={bucketLocation}
                    sourceGCPWorkspaceRegion={sourceGCPWorkspaceRegion}
                    sourceGCPWorkspaceRegionError={sourceGCPWorkspaceRegionError}
                  />
                )}
                {createError && <div style={{ marginTop: '1rem', color: colors.danger() }}>{createError}</div>}
                {!creating && buttons}
              </>
            )}
          </Modal>
        ),
      ],
      () => (
        <NoBillingModal
          onDismiss={onDismiss}
          isCloning={!!cloneWorkspace}
          requireEnhancedBucketLogging={requireEnhancedBucketLogging}
        />
      )
    );
  }
);

interface NoBillingModalProps {
  onDismiss: () => void;
  isCloning?: boolean;
  requireEnhancedBucketLogging?: boolean;
}

const NoBillingModal = (props: NoBillingModalProps) => {
  const { isCloning, requireEnhancedBucketLogging, onDismiss } = props;

  const getNoApplicableBillingProjectsMessage = () => {
    if (isCloning) {
      return 'You do not have a billing project that is able to clone this workspace.';
    }
    if (requireEnhancedBucketLogging) {
      return 'You do not have access to a billing project that supports additional security monitoring.';
    }
    return 'You need a billing project to create a new workspace.';
  };

  return (
    <Modal
      title='Set Up Billing'
      onDismiss={onDismiss}
      okButton={<ButtonPrimary onClick={() => Nav.goToPath('billing')}>Go to Billing</ButtonPrimary>}
    >
      <div>
        <Icon icon='error-standard' size={16} style={{ marginRight: '0.5rem', color: colors.warning() }} />
        {getNoApplicableBillingProjectsMessage()}
      </div>
    </Modal>
  );
};

export default NewWorkspaceWizard;
