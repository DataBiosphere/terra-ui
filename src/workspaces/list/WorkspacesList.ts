import _ from 'lodash/fp';
import { ReactNode, useMemo, useState } from 'react';
import { div, h, p } from 'react-hyperscript-helpers';
import { isAzureUser } from 'src/auth/auth';
import { Link, topSpinnerOverlay, transparentSpinnerOverlay } from 'src/components/common';
import FooterWrapper from 'src/components/FooterWrapper';
import { icon } from 'src/components/icons';
import TopBar from 'src/components/TopBar';
import { Ajax } from 'src/libs/ajax';
import { withErrorIgnoring } from 'src/libs/error';
import { updateSearch, useRoute } from 'src/libs/nav';
import { useOnMount } from 'src/libs/react-utils';
import { elements as StyleElements } from 'src/libs/style';
import { newTabLinkProps } from 'src/libs/utils';
import { useCloningWorkspaceNotifications } from 'src/workspaces/common/state/useCloningWorkspaceNotifications';
import { useWorkspaces } from 'src/workspaces/common/state/useWorkspaces';
import { useWorkspaceStatePolling } from 'src/workspaces/common/state/useWorkspaceStatePolling';
import { categorizeWorkspaces } from 'src/workspaces/list/CategorizedWorkspaces';
import { RecentlyViewedWorkspaces } from 'src/workspaces/list/RecentlyViewedWorkspaces';
import {
  getWorkspaceFiltersFromQuery,
  WorkspaceFilters,
  WorkspaceFilterValues,
} from 'src/workspaces/list/WorkspaceFilters';
import { WorkspacesListModals } from 'src/workspaces/list/WorkspacesListModals';
import { WorkspacesListTabs } from 'src/workspaces/list/WorkspacesListTabs';
import { WorkspaceUserActions, WorkspaceUserActionsContext } from 'src/workspaces/list/WorkspaceUserActions';
import { cloudProviderTypes, WorkspaceWrapper as Workspace } from 'src/workspaces/utils';

export const persistenceId = 'workspaces/list';

export const getWorkspace = (id: string, workspaces: Workspace[]): Workspace =>
  _.find({ workspace: { workspaceId: id } }, workspaces)!;

export const WorkspacesList = (): ReactNode => {
  const {
    workspaces,
    refresh: refreshWorkspaces,
    loading: loadingWorkspaces,
    status,
  } = useWorkspaces(
    [
      'accessLevel',
      'public',
      'workspace.attributes.description',
      'workspace.attributes.tag:tags',
      'workspace.authorizationDomain',
      'workspace.bucketName',
      'workspace.cloudPlatform',
      'workspace.createdBy',
      'workspace.googleProject',
      'workspace.lastModified',
      'workspace.name',
      'workspace.namespace',
      'workspace.workspaceId',
      'workspace.state',
      'workspace.errorMessage',
      'workspace.isLocked',
    ],
    250
  );

  useCloningWorkspaceNotifications();
  useWorkspaceStatePolling(workspaces, status);

  const [featuredList, setFeaturedList] = useState<{ name: string; namespace: string }[]>();
  const { query } = useRoute();
  const filters: WorkspaceFilterValues = getWorkspaceFiltersFromQuery(query);

  useOnMount(() => {
    // For some time after Terra on Azure is released, the vast majority of featured workspaces
    // will be GCP workspaces, which are not usable by Azure users. To improve visibility of the
    // featured workspaces that are available on Azure, automatically filter workspaces by cloud
    // platform for Azure users.
    if (isAzureUser() && !filters.cloudPlatform) {
      updateSearch({ ...query, cloudPlatform: cloudProviderTypes.AZURE });
    }
  });

  useOnMount(() => {
    const loadFeatured = withErrorIgnoring(async () => {
      setFeaturedList(await Ajax().FirecloudBucket.getFeaturedWorkspaces());
    });
    loadFeatured();
  });
  const sortedWorkspaces = useMemo(() => categorizeWorkspaces(workspaces, featuredList), [workspaces, featuredList]);

  const [userActions, setUserActions] = useState<WorkspaceUserActions>({ creatingNewWorkspace: false });
  const updateUserActions = (newActions: Partial<WorkspaceUserActions>) =>
    setUserActions({ ...userActions, ...newActions });

  return h(WorkspaceUserActionsContext.Provider, { value: { userActions, setUserActions: updateUserActions } }, [
    h(FooterWrapper, [
      h(TopBar, { title: 'Workspaces', href: undefined }, []),
      div({ role: 'main', style: { padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' } }, [
        div({ style: { display: 'flex', alignItems: 'center', marginBottom: '0.5rem' } }, [
          div({ style: { ...StyleElements.sectionHeader, fontSize: '1.5rem' } }, ['Workspaces']),
          h(
            Link,
            {
              onClick: () => updateUserActions({ creatingNewWorkspace: true }),
              style: { marginLeft: '0.5rem' },
              tooltip: 'Create a new workspace',
            },
            [icon('lighter-plus-circle', { size: 24 })]
          ),
        ]),
        p({ style: { margin: '0 0 1rem' } }, [
          'Dedicated spaces for you and your collaborators to access and analyze data together. ',
          h(
            Link,
            {
              ...newTabLinkProps,
              href: 'https://support.terra.bio/hc/en-us/articles/360024743371-Working-with-workspaces',
            },
            ['Learn more about workspaces.']
          ),
        ]),
        h(RecentlyViewedWorkspaces, { workspaces }),
        h(WorkspaceFilters, { workspaces }),
        h(WorkspacesListTabs, {
          workspaces: sortedWorkspaces,
          loadingWorkspaces,
          refreshWorkspaces,
        }),
        h(WorkspacesListModals, { getWorkspace: (id) => getWorkspace(id, workspaces), refreshWorkspaces }),
        loadingWorkspaces && (!workspaces ? transparentSpinnerOverlay : topSpinnerOverlay),
      ]),
    ]),
  ]);
};
