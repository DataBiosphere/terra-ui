import { SpinnerOverlay } from '@terra-ui-packages/components';
import { withHandlers } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import * as qs from 'qs';
import { useEffect, useRef, useState } from 'react';
import { div, h, h2, p, span } from 'react-hyperscript-helpers';
import * as Auth from 'src/auth/auth';
import { CreateBillingProjectControl } from 'src/billing/List/CreateBillingProjectControl';
import { GCPNewBillingProjectModal } from 'src/billing/List/GCPNewBillingProjectModal';
import { ProjectListItem, ProjectListItemProps } from 'src/billing/List/ProjectListItem';
import { AzureBillingProjectWizard } from 'src/billing/NewBillingProjectWizard/AzureBillingProjectWizard/AzureBillingProjectWizard';
import { GCPBillingProjectWizard } from 'src/billing/NewBillingProjectWizard/GCPBillingProjectWizard/GCPBillingProjectWizard';
import ProjectDetail from 'src/billing/Project';
import { isCreating, isDeleting } from 'src/billing/utils';
import { billingRoles } from 'src/billing/utils';
import { BillingProject, GoogleBillingAccount } from 'src/billing-core/models';
import Collapse from 'src/components/Collapse';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { reportErrorAndRethrow } from 'src/libs/error';
import Events from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import { useCancellation, useOnMount } from 'src/libs/react-utils';
import * as StateHistory from 'src/libs/state-history';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { useWorkspaces } from 'src/workspaces/common/state/useWorkspaces';
import { CloudProvider, cloudProviderTypes } from 'src/workspaces/utils';

const BillingProjectSubheader = ({ title, children }) =>
  h(
    Collapse,
    {
      title: span({ style: { fontWeight: 'bold' } }, [title]),
      initialOpenState: true,
      titleFirst: true,
      summaryStyle: { padding: '1rem 1rem 1rem 2rem' },
    },
    [children]
  );

interface BillingListProps {
  queryParams: {
    selectedName: string | undefined;
  };
}

export const BillingList = (props: BillingListProps) => {
  // State
  const [billingProjects, setBillingProjects] = useState<BillingProject[]>(StateHistory.get().billingProjects || []);
  const [creatingBillingProjectType, setCreatingBillingProjectType] = useState<CloudProvider | null>();
  const [billingAccounts, setBillingAccounts] = useState<Record<string, GoogleBillingAccount>>({});
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(false);
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState<boolean>(false);
  const { workspaces: allWorkspaces, loading: workspacesLoading, refresh: refreshWorkspaces } = useWorkspaces();

  const signal = useCancellation();
  const interval = useRef<number>();
  const selectedName = props.queryParams.selectedName;
  const billingProjectListWidth = 350;

  // Helpers
  const loadProjects = _.flow(
    reportErrorAndRethrow('Error loading billing projects list'),
    Utils.withBusyState(setIsLoadingProjects)
  )(async () => setBillingProjects(_.sortBy('projectName', await Ajax(signal).Billing.listProjects())));

  const reloadBillingProject = _.flow(
    reportErrorAndRethrow('Error loading billing project'),
    Utils.withBusyState(setIsLoadingProjects)
  )(async ({ projectName }) => {
    const index = _.findIndex({ projectName }, billingProjects);
    // fetch the project to error if it doesn't exist/user can't access
    // The component that calls this function is only rendered when selectedName is non-null.
    const project = await Ajax(signal).Billing.getProject(selectedName!);
    setBillingProjects(_.set([index], project));
  });

  const authorizeAccounts = _.flow(
    reportErrorAndRethrow('Error setting up authorization'),
    Utils.withBusyState(setIsAuthorizing)
  )(Auth.ensureBillingScope);

  const tryAuthorizeAccounts = _.flow(
    reportErrorAndRethrow('Error setting up authorization'),
    Utils.withBusyState(setIsAuthorizing)
  )(Auth.tryBillingScope);

  const loadAccounts = withHandlers(
    [reportErrorAndRethrow('Error loading billing accounts'), Utils.withBusyState(setIsLoadingAccounts)],
    async () => {
      if (Auth.hasBillingScope()) {
        void (await Ajax(signal)
          .Billing.listAccounts()
          .then(_.keyBy('accountName')) // @ts-ignore
          .then(setBillingAccounts));
      }
    }
  );

  const authorizeAndLoadAccounts = () => authorizeAccounts().then(loadAccounts);

  const showCreateProjectModal = async (type: CloudProvider) => {
    if (type === 'AZURE') {
      setCreatingBillingProjectType(type);
      // Show the Azure wizard instead of the selected billing project.
      Nav.history.replace({ search: '' });
    } else if (Auth.hasBillingScope()) {
      setCreatingBillingProjectType(type);
    } else {
      await authorizeAndLoadAccounts();
      Auth.hasBillingScope() && setCreatingBillingProjectType(type);
    }
  };

  // Lifecycle
  useOnMount(() => {
    loadProjects();
    tryAuthorizeAccounts().then(loadAccounts);
  });

  useEffect(() => {
    const projectsCreatingOrDeleting = _.some((project) => isCreating(project) || isDeleting(project), billingProjects);

    if (projectsCreatingOrDeleting && !interval.current) {
      interval.current = window.setInterval(loadProjects, 30000);
    } else if (!projectsCreatingOrDeleting && interval.current) {
      clearInterval(interval.current);
      interval.current = undefined;
    }

    StateHistory.update({ billingProjects });

    return () => {
      clearInterval(interval.current);
      interval.current = undefined;
    };
  });

  // Render
  const [projectsOwned, projectsShared] = _.partition(
    ({ roles }) => _.includes(billingRoles.owner, roles),
    billingProjects
  );

  const azureUserWithNoBillingProjects = !isLoadingProjects && _.isEmpty(billingProjects) && Auth.isAzureUser();
  const creatingAzureBillingProject = !selectedName && creatingBillingProjectType === 'AZURE';

  const makeProjectListItemProps = (project: BillingProject): ProjectListItemProps => {
    return {
      project,
      isActive: !!selectedName && project.projectName === selectedName,
      billingProjectActionsProps: { allWorkspaces, workspacesLoading, loadProjects, projectName: project.projectName },
    };
  };

  return div({ role: 'main', style: { display: 'flex', flex: 1, height: `calc(100% - ${Style.topBarHeight}px)` } }, [
    div(
      {
        style: {
          minWidth: billingProjectListWidth,
          maxWidth: billingProjectListWidth,
          boxShadow: '0 2px 5px 0 rgba(0,0,0,0.25)',
          overflowY: 'auto',
        },
      },
      [
        div(
          {
            role: 'navigation',
            style: {
              fontSize: 16,
              fontWeight: 600,
              padding: '2rem 1rem 1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              textTransform: 'uppercase',
              color: colors.dark(),
            },
          },
          [
            h2({ style: { fontSize: 16 } }, ['Billing Projects']),
            h(CreateBillingProjectControl, { showCreateProjectModal }),
          ]
        ),
        h(BillingProjectSubheader, { title: 'Owned by You' }, [
          div({ role: 'list' }, [
            _.map(
              (project) => h(ProjectListItem, { key: project.projectName, ...makeProjectListItemProps(project) }),
              projectsOwned
            ),
          ]),
        ]),
        h(BillingProjectSubheader, { title: 'Shared with You' }, [
          div({ role: 'list' }, [
            _.map(
              (project) => h(ProjectListItem, { key: project.projectName, ...makeProjectListItemProps(project) }),
              projectsShared
            ),
          ]),
        ]),
      ]
    ),
    creatingBillingProjectType === 'GCP' &&
      h(GCPNewBillingProjectModal, {
        billingAccounts,
        loadAccounts,
        onDismiss: () => setCreatingBillingProjectType(null),
        onSuccess: (billingProjectName) => {
          Ajax().Metrics.captureEvent(Events.billingCreationBillingProjectCreated, {
            billingProjectName,
            cloudPlatform: cloudProviderTypes.GCP,
          });
          setCreatingBillingProjectType(null);
          loadProjects();
        },
      }),
    div(
      {
        style: {
          overflowY: 'auto',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
        },
      },
      [
        Utils.cond(
          [
            !!selectedName && !_.some({ projectName: selectedName }, billingProjects),
            () =>
              div(
                {
                  style: {
                    margin: '1rem auto 0 auto',
                  },
                },
                [
                  div([
                    h2(['Error loading selected billing project.']),
                    p(['It may not exist, or you may not have access to it.']),
                  ]),
                ]
              ),
          ],
          [
            azureUserWithNoBillingProjects || creatingAzureBillingProject,
            () =>
              h(AzureBillingProjectWizard, {
                onSuccess: (billingProjectName, protectedData) => {
                  Ajax().Metrics.captureEvent(Events.billingCreationBillingProjectCreated, {
                    billingProjectName,
                    cloudPlatform: cloudProviderTypes.AZURE,
                    protectedData,
                  });
                  setCreatingBillingProjectType(null);
                  loadProjects();
                },
              }),
          ],
          [
            !isLoadingProjects && _.isEmpty(billingProjects) && !Auth.isAzureUser(),
            () =>
              h(GCPBillingProjectWizard, {
                billingAccounts,
                onSuccess: (billingProjectName) => {
                  Ajax().Metrics.captureEvent(Events.billingCreationBillingProjectCreated, {
                    billingProjectName,
                    cloudPlatform: cloudProviderTypes.GCP,
                  });
                  setCreatingBillingProjectType(null);
                  loadProjects();
                  Nav.history.push({
                    pathname: Nav.getPath('billing'),
                    search: qs.stringify({ selectedName: billingProjectName, type: 'project' }),
                  });
                },
                authorizeAndLoadAccounts,
              }),
          ],
          [
            !!selectedName && _.some({ projectName: selectedName }, billingProjects),
            () => {
              const billingProject = _.find({ projectName: selectedName }, billingProjects);
              return h(ProjectDetail, {
                key: selectedName,
                // We know from the condition that the billingProject does exist.
                // @ts-ignore
                billingProject,
                billingAccounts,
                authorizeAndLoadAccounts,
                reloadBillingProject: () => reloadBillingProject(billingProject).catch(loadProjects),
                isOwner: _.some({ projectName: selectedName }, projectsOwned),
                workspaces: allWorkspaces,
                refreshWorkspaces,
              });
            },
          ],
          [
            !_.isEmpty(projectsOwned) && !selectedName,
            () => {
              return div({ style: { margin: '1rem auto 0 auto' } }, ['Select a Billing Project']);
            },
          ]
        ),
      ]
    ),
    (isLoadingProjects || isAuthorizing || isLoadingAccounts) && h(SpinnerOverlay, { mode: 'FullScreen' } as const),
  ]);
};
