import _ from 'lodash/fp';
import { FC, useMemo, useState } from 'react';
import { div, h, p } from 'react-hyperscript-helpers';
import { Link, topSpinnerOverlay, transparentSpinnerOverlay } from 'src/components/common';
import FooterWrapper from 'src/components/FooterWrapper';
import { icon } from 'src/components/icons';
import TopBar from 'src/components/TopBar';
import { Ajax } from 'src/libs/ajax';
import { isAzureUser } from 'src/libs/auth';
import { withErrorIgnoring } from 'src/libs/error';
import { updateSearch, useRoute } from 'src/libs/nav';
import { useOnMount } from 'src/libs/react-utils';
import { elements as StyleElements } from 'src/libs/style';
import { newTabLinkProps } from 'src/libs/utils';
import { cloudProviderTypes, WorkspaceWrapper as Workspace } from 'src/libs/workspace-utils';
import { catagorizeWorkspaces } from 'src/pages/workspaces/WorkspacesList/CatagorizedWorkspaces';
import { RecentlyViewedWorkspaces } from 'src/pages/workspaces/WorkspacesList/RecentlyViewedWorkspaces';
import { useWorkspacesWithSubmissionStats } from 'src/pages/workspaces/WorkspacesList/useWorkspacesWithSubmissionStats';
import {
  getWorkspaceFiltersFromQuery,
  WorkspaceFilters,
  WorkspaceFilterValues,
} from 'src/pages/workspaces/WorkspacesList/WorkspaceFilters';
import { WorkspacesListTabs } from 'src/pages/workspaces/WorkspacesList/WorkspaceListTabs';
import { WorkspacesListModals } from 'src/pages/workspaces/WorkspacesList/WorkspacesListModals';
import { updateWorkspaceActions } from 'src/pages/workspaces/WorkspacesList/WorkspaceUserActions';

export const persistenceId = 'workspaces/list';

export const getWorkspace = (id: string, workspaces: Workspace[]): Workspace =>
  _.find({ workspace: { workspaceId: id } }, workspaces)!;

export const WorkspacesList: FC<{}> = () => {
  const {
    workspaces,
    refresh: refreshWorkspaces,
    loadingWorkspaces,
    loadingSubmissionStats,
  } = useWorkspacesWithSubmissionStats();
  const [featuredList, setFeaturedList] = useState<Workspace[]>();

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

  const initialFiltered = useMemo(() => catagorizeWorkspaces(workspaces, featuredList), [workspaces, featuredList]);

  return h(FooterWrapper, [
    h(TopBar, { title: 'Workspaces', href: undefined }, []),
    div({ role: 'main', style: { padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' } }, [
      div({ style: { display: 'flex', alignItems: 'center', marginBottom: '0.5rem' } }, [
        div({ style: { ...StyleElements.sectionHeader, fontSize: '1.5rem' } }, ['Workspaces']),
        h(
          Link,
          {
            onClick: () => updateWorkspaceActions({ creatingNewWorkspace: true }),
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
      h(RecentlyViewedWorkspaces, { workspaces, loadingSubmissionStats }),
      h(WorkspaceFilters, { workspaces }),
      h(WorkspacesListTabs, {
        workspaces: initialFiltered,
        loadingSubmissionStats,
        loadingWorkspaces,
        refreshWorkspaces,
      }),
      h(WorkspacesListModals, { getWorkspace: (id) => getWorkspace(id, workspaces), refreshWorkspaces }),
      loadingWorkspaces && (!workspaces ? transparentSpinnerOverlay : topSpinnerOverlay),
    ]),
  ]);
};
