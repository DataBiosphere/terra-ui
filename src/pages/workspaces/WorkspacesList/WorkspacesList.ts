import _ from 'lodash/fp';
import { FC, useEffect, useMemo, useState } from 'react';
import { div, h, p, span } from 'react-hyperscript-helpers';
import Collapse from 'src/components/Collapse';
import { Link, topSpinnerOverlay, transparentSpinnerOverlay } from 'src/components/common';
import FooterWrapper from 'src/components/FooterWrapper';
import { icon } from 'src/components/icons';
import TopBar from 'src/components/TopBar';
import { recentlyViewedPersistenceId, RecentlyViewedWorkspaceCard } from 'src/components/workspace-utils';
import { Ajax } from 'src/libs/ajax';
import { isAzureUser } from 'src/libs/auth';
import { withErrorIgnoring } from 'src/libs/error';
import * as Nav from 'src/libs/nav';
import { getLocalPref, setLocalPref } from 'src/libs/prefs';
import { useOnMount } from 'src/libs/react-utils';
import { elements as StyleElements } from 'src/libs/style';
import { newTabLinkProps } from 'src/libs/utils';
import { cloudProviderTypes, WorkspaceWrapper as Workspace } from 'src/libs/workspace-utils';
import { catagorizeWorkspaces } from 'src/pages/workspaces/WorkspacesList/CatagorizedWorkspaces';
import {
  useWorkspacesWithSubmissionStats,
  workspaceSubmissionStatus,
} from 'src/pages/workspaces/WorkspacesList/useWorkspacesWithSubmissionStats';
import {
  getWorkspaceFiltersFromQuery,
  WorkspaceFilters,
  WorkspaceFilterValues,
} from 'src/pages/workspaces/WorkspacesList/WorkspaceFilters';
import { WorkspacesListTabs } from 'src/pages/workspaces/WorkspacesList/WorkspaceListTabs';
import { WorkspacesListModals } from 'src/pages/workspaces/WorkspacesList/WorkspacesListModals';
import { updateWorkspaceActions } from 'src/pages/workspaces/WorkspacesList/WorkspaceUserActions';

export const WorkspacesList: FC<{}> = () => {
  const {
    workspaces,
    refresh: refreshWorkspaces,
    loadingWorkspaces,
    loadingSubmissionStats,
  } = useWorkspacesWithSubmissionStats();
  const [featuredList, setFeaturedList] = useState<Workspace[]>();

  // A user may have lost access to a workspace after viewing it, so we'll filter those out just in case
  const recentlyViewed = useMemo(
    () =>
      _.filter(
        (w) => _.find({ workspace: { workspaceId: w.workspaceId } }, workspaces),
        getLocalPref(recentlyViewedPersistenceId)?.recentlyViewed || []
      ),
    [workspaces]
  );

  const persistenceId = 'workspaces/list';
  const [recentlyViewedOpen, setRecentlyViewedOpen] = useState(() =>
    _.defaultTo(true, getLocalPref(persistenceId)?.recentlyViewedOpen)
  );

  const { query } = Nav.useRoute();

  const filters: WorkspaceFilterValues = getWorkspaceFiltersFromQuery(query);

  useOnMount(() => {
    // For some time after Terra on Azure is released, the vast majority of featured workspaces
    // will be GCP workspaces, which are not usable by Azure users. To improve visibility of the
    // featured workspaces that are available on Azure, automatically filter workspaces by cloud
    // platform for Azure users.
    if (isAzureUser() && !filters.cloudPlatform) {
      Nav.updateSearch({ ...query, cloudPlatform: cloudProviderTypes.AZURE });
    }
  });

  useOnMount(() => {
    const loadFeatured = withErrorIgnoring(async () => {
      setFeaturedList(await Ajax().FirecloudBucket.getFeaturedWorkspaces());
    });
    loadFeatured();
  });

  useEffect(() => {
    setLocalPref(persistenceId, { recentlyViewedOpen });
  }, [recentlyViewedOpen, persistenceId]);

  const getWorkspace = (id: string): Workspace => _.find({ workspace: { workspaceId: id } }, workspaces)!;

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
      !_.isEmpty(workspaces) &&
        !_.isEmpty(recentlyViewed) &&
        h(
          Collapse,
          {
            title: 'Recently Viewed',
            initialOpenState: recentlyViewedOpen,
            noTitleWrap: true,
            onClick: () => setRecentlyViewedOpen((v) => !v),
            summaryStyle: { margin: '0.5rem 0' },
          },
          [
            // Stop the click propagation here, otherwise using spacebar to click on a card will also collapse the Recently Viewed section
            span({ onClick: (e) => e.stopPropagation() }, [
              div(
                { style: { display: 'flex', flexWrap: 'wrap', paddingBottom: '1rem' } },
                _.map(({ workspaceId, timestamp }) => {
                  const workspace = getWorkspace(workspaceId);
                  return h(RecentlyViewedWorkspaceCard, {
                    workspace,
                    loadingSubmissionStats,
                    timestamp,
                    submissionStatus: workspaceSubmissionStatus(workspace),
                  });
                }, recentlyViewed)
              ),
            ]),
          ]
        ),
      h(WorkspaceFilters, { workspaces }),
      h(WorkspacesListTabs, {
        workspaces: initialFiltered,
        loadingSubmissionStats,
        loadingWorkspaces,
        refreshWorkspaces,
      }),
      h(WorkspacesListModals, { getWorkspace, refreshWorkspaces }),
      loadingWorkspaces && (!workspaces ? transparentSpinnerOverlay : topSpinnerOverlay),
    ]),
  ]);
};
