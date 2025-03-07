import { ButtonSecondary, Icon, Modal, modalStyles } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { ReactNode, useState } from 'react';
import { defaultLocation } from 'src/analysis/utils/runtime-utils';
import { BillingProject, CloudPlatform, GCPBillingProject } from 'src/billing-core/models';
import { ButtonPrimary, spinnerOverlay } from 'src/components/common';
import { isSupportedBucketLocation } from 'src/components/region-common';
import { TabWizard } from 'src/components/tabWizard';
import { Billing } from 'src/libs/ajax/billing/Billing';
import { FirecloudBucket } from 'src/libs/ajax/firecloud/FirecloudBucket';
import { CurrentUserGroupMembership, Groups } from 'src/libs/ajax/Groups';
import { Metrics } from 'src/libs/ajax/Metrics';
import { Workspaces } from 'src/libs/ajax/workspaces/Workspaces';
import colors from 'src/libs/colors';
import { withErrorReportingInModal } from 'src/libs/error';
import Events, { extractCrossWorkspaceDetails, extractWorkspaceDetails } from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import { useCancellation, useOnMount, withDisplayName } from 'src/libs/react-utils';
import * as Utils from 'src/libs/utils';
import { CloneEgressWarning } from 'src/workspaces/NewWorkspaceModal/CloneEgressWarning';
import { CreatingWorkspaceMessage } from 'src/workspaces/NewWorkspaceModal/CreatingWorkspaceMessage';
import { isGoogleWorkspace, isProtectedWorkspace, WorkspaceInfo, WorkspaceWrapper } from 'src/workspaces/utils';
import validate from 'validate.js';

import { WorkspaceAcl } from '../acl-utils';
import { NewWorkspaceBasicTab } from './NewWorkspaceBasicTab';
import { NewWorkspaceSecurityTab } from './NewWorkspaceSecurityTab';
import { NewWorkspaceSharingTab } from './NewWorkspaceSharingTab';

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
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string>();
    const [bucketLocation, setBucketLocation] = useState(defaultLocation);
    const [sourceGCPWorkspaceRegion, setSourceGCPWorkspaceRegion] = useState<string>(defaultLocation);
    const [sourceGCPWorkspaceRegionError, setSourceGCPWorkspaceRegionError] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('basic');
    const [acl, setAcl] = useState<WorkspaceAcl>([]);
    const signal = useCancellation();

    // Helpers
    const getRequiredGroups = (): string[] =>
      _.uniq([
        ...(cloneWorkspace ? _.map('membersGroupName', cloneWorkspace.workspace.authorizationDomain) : []),
        ...(requiredAuthDomain ? [requiredAuthDomain] : []),
      ]);

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
              setSourceGCPWorkspaceRegion(location);
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
    });

    // Render
    const existingGroups = getRequiredGroups();
    const hasBillingProjects = !!billingProjects && !!billingProjects.length;
    const errors = validate({ namespace, name }, constraints, {
      prettify: (v) => ({ namespace: 'Billing project', name: 'Name' }[v] || validate.prettify(v)),
    });

    const handleSecondaryButtonClick = async () =>
      Utils.switchCase(
        activeTab,
        ['basic', async () => await create()],
        [
          'sharing',
          async () => {
            // TODO is there any data that needs to be included?
            void Metrics().captureEvent(Events.workspaceCreateBasic);
            setActiveTab('basic');
            return Promise.resolve();
          },
        ],
        [
          'security',
          async () => {
            void Metrics().captureEvent(Events.workspaceCreateSharing);
            setActiveTab('sharing');
            return Promise.resolve();
          },
        ]
      );

    const handlePrimaryButtonClick = async () =>
      Utils.switchCase(
        activeTab,
        [
          'basic',
          async () => {
            void Metrics().captureEvent(Events.workspaceCreateSharing);
            setActiveTab('sharing');
            return Promise.resolve();
          },
        ],
        [
          'sharing',
          async () => {
            // TODO is there any data that needs to be included?
            void Metrics().captureEvent(Events.workspaceCreateSecurity);
            setActiveTab('security');
            return Promise.resolve();
          },
        ],
        [
          'security',
          async () => {
            await create();
          },
        ]
      );

    const getTooltip = () => {
      if (activeTab === 'basic') {
        if (errors) {
          return Utils.summarizeErrors(errors);
        }
        return 'Allows you to quickly create workspace without any sharing or additional security options';
      }
      return undefined;
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
        <div style={{ display: 'flex', gap: '1rem', marginLeft: 'auto' }}>
          <ButtonSecondary
            style={{ padding: '0 1rem', marginLeft: '1rem', border: '1px solid', borderRadius: '5px' }}
            disabled={activeTab === 'basic' && errors}
            tooltip={getTooltip()}
            onClick={handleSecondaryButtonClick}
          >
            {Utils.cond([activeTab === 'basic', () => 'Quick create workspace'], () => 'Previous')}
          </ButtonSecondary>
          <ButtonPrimary
            style={{ padding: '0 1rem', marginLeft: '1rem' }}
            disabled={errors}
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
            styles={{ modal: { height: 675 } }}
          >
            {creating ? (
              <CreatingWorkspaceMessage />
            ) : (
              <>
                <TabWizard
                  aria-label='create workspace wizard'
                  activeTab={activeTab}
                  tabs={[
                    { name: 'basic', displayName: '1. Basic Information and Billing', disabled: () => false },
                    { name: 'sharing', displayName: '2. Sharing', disabled: () => activeTab === 'basic' && !!errors },
                    {
                      name: 'security',
                      displayName: '3. Additional Security Options',
                      disabled: () => activeTab === 'basic' && !!errors,
                    },
                  ]}
                  style={{ textTransform: 'none', width: '90%' }}
                  getHref={() => {}}
                  getOnClick={(currentTab) => {
                    setActiveTab(currentTab.name);
                  }}
                >
                  {null /* nothing to display at the end of the tab bar */}
                </TabWizard>
                {activeTab === 'basic' && (
                  <NewWorkspaceBasicTab
                    setName={setName}
                    name={name}
                    errors={errors}
                    description={description}
                    setDescription={setDescription}
                    namespace={namespace}
                    billingProjects={billingProjects}
                    setNamespace={setNamespace}
                    bucketLocation={bucketLocation}
                    setBucketLocation={setBucketLocation}
                  />
                )}
                {activeTab === 'sharing' && <NewWorkspaceSharingTab acl={acl} setAcl={setAcl} />}
                {activeTab === 'security' && (
                  <NewWorkspaceSecurityTab
                    requireEnhancedBucketLogging={requireEnhancedBucketLogging}
                    setEnhancedBucketLogging={setEnhancedBucketLogging}
                    groups={groups}
                    setGroups={setGroups}
                    cloningGcpProtectedWorkspace={cloningGcpProtectedWorkspace}
                    existingGroups={existingGroups}
                    allGroups={allGroups}
                    billingProjects={billingProjects}
                    renderNotice={renderNotice}
                    selectedBillingProject={selectedBillingProject}
                    enhancedBucketLogging={enhancedBucketLogging}
                  />
                )}

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
