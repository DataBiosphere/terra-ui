import _ from 'lodash/fp';
import { FC, useEffect, useMemo, useState } from 'react';
import { div, h, p, span } from 'react-hyperscript-helpers';
import Collapse from 'src/components/Collapse';
import { Link, topSpinnerOverlay, transparentSpinnerOverlay } from 'src/components/common';
import FooterWrapper from 'src/components/FooterWrapper';
import { icon } from 'src/components/icons';
import LeaveResourceModal from 'src/components/LeaveResourceModal';
import NewWorkspaceModal from 'src/components/NewWorkspaceModal';
import { SimpleTabBar } from 'src/components/tabBars';
import TopBar from 'src/components/TopBar';
import { recentlyViewedPersistenceId, RecentlyViewedWorkspaceCard } from 'src/components/workspace-utils';
import { Ajax } from 'src/libs/ajax';
import { isAzureUser } from 'src/libs/auth';
import { withErrorIgnoring } from 'src/libs/error';
import * as Nav from 'src/libs/nav';
import { getLocalPref, setLocalPref } from 'src/libs/prefs';
import { useOnMount } from 'src/libs/react-utils';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import {
  cloudProviderTypes,
  getCloudProviderFromWorkspace,
  WorkspaceAccessLevels,
  WorkspaceWrapper as Workspace,
} from 'src/libs/workspace-utils';
import DeleteWorkspaceModal from 'src/pages/workspaces/workspace/DeleteWorkspaceModal';
import LockWorkspaceModal from 'src/pages/workspaces/workspace/LockWorkspaceModal';
import { RequestAccessModal } from 'src/pages/workspaces/workspace/RequestAccessModal';
import ShareWorkspaceModal from 'src/pages/workspaces/workspace/ShareWorkspaceModal/ShareWorkspaceModal';
import { catagorizeWorkspaces } from 'src/pages/workspaces/WorkspacesList/CatagorizedWorkspaces';
import { RenderedWorkspaces } from 'src/pages/workspaces/WorkspacesList/RenderedWorkspaces';
import {
  useWorkspacesWithSubmissionStats,
  workspaceSubmissionStatus,
} from 'src/pages/workspaces/WorkspacesList/useWorkspacesWithSubmissionStats';
import { WorkspaceFilters } from 'src/pages/workspaces/WorkspacesList/WorkspaceFilters';

const EMPTY_LIST = [];

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
  const filter = query.filter || '';
  // Using the EMPTY_LIST constant as a default value instead of creating a new empty array on
  // each render avoids unnecessarily recomputing the memoized filteredWorkspaces value.
  const accessLevelsFilter: WorkspaceAccessLevels = query.accessLevelsFilter || EMPTY_LIST;
  const projectsFilter = query.projectsFilter || undefined;
  const cloudPlatformFilter = query.cloudPlatform || undefined;
  const submissionsFilter = query.submissionsFilter || EMPTY_LIST;
  const tab = query.tab || 'myWorkspaces';
  const tagsFilter = query.tagsFilter || EMPTY_LIST;

  useOnMount(() => {
    // For some time after Terra on Azure is released, the vast majority of featured workspaces
    // will be GCP workspaces, which are not usable by Azure users. To improve visibility of the
    // featured workspaces that are available on Azure, automatically filter workspaces by cloud
    // platform for Azure users.
    if (isAzureUser() && !cloudPlatformFilter) {
      Nav.updateSearch({ ...query, cloudPlatform: cloudProviderTypes.AZURE });
    }
  });

  const [creatingNewWorkspace, setCreatingNewWorkspace] = useState<boolean>(false);
  const [cloningWorkspaceId, setCloningWorkspaceId] = useState<string>();
  const [deletingWorkspaceId, setDeletingWorkspaceId] = useState<string>();
  const [lockingWorkspaceId, setLockingWorkspaceId] = useState<string>();
  const [sharingWorkspace, setSharingWorkspace] = useState<Workspace>();
  const [leavingWorkspaceId, setLeavingWorkspaceId] = useState<string>();
  const [requestingAccessWorkspaceId, setRequestingAccessWorkspaceId] = useState<string>();

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

  const initialFiltered = useMemo(() => {
    return catagorizeWorkspaces(workspaces, featuredList);
  }, [workspaces, featuredList]);

  const filteredWorkspaces = useMemo(
    () =>
      _.mapValues(
        _.filter((ws: Workspace) => {
          const {
            workspace: { namespace, name, attributes },
          } = ws;
          return (
            Utils.textMatch(filter, `${namespace}/${name}`) &&
            (_.isEmpty(accessLevelsFilter) || accessLevelsFilter.includes(ws.accessLevel)) &&
            (_.isEmpty(projectsFilter) || projectsFilter === namespace) &&
            (_.isEmpty(cloudPlatformFilter) || getCloudProviderFromWorkspace(ws) === cloudPlatformFilter) &&
            (_.isEmpty(submissionsFilter) || submissionsFilter.includes(workspaceSubmissionStatus(ws))) &&
            _.every((a) => _.includes(a, _.get(['tag:tags', 'items'], attributes)), tagsFilter)
          );
        }),
        initialFiltered
      ),
    [accessLevelsFilter, filter, initialFiltered, projectsFilter, cloudPlatformFilter, submissionsFilter, tagsFilter]
  );

  const tabs = _.map(
    (key) => ({
      key,
      title: span([_.upperCase(key), ` (${loadingWorkspaces ? '...' : filteredWorkspaces[key].length})`]),
      tableName: _.lowerCase(key),
    }),
    ['myWorkspaces', 'newAndInteresting', 'featured', 'public']
  );

  return h(FooterWrapper, [
    h(TopBar, { title: 'Workspaces' }),
    div({ role: 'main', style: { padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' } }, [
      div({ style: { display: 'flex', alignItems: 'center', marginBottom: '0.5rem' } }, [
        div({ style: { ...Style.elements.sectionHeader, fontSize: '1.5rem' } }, ['Workspaces']),
        h(
          Link,
          {
            onClick: () => setCreatingNewWorkspace(true),
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
            ...Utils.newTabLinkProps,
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
      h(
        SimpleTabBar,
        {
          'aria-label': 'choose a workspace collection',
          value: tab,
          onChange: (newTab) => {
            if (newTab === tab) {
              refreshWorkspaces();
            } else {
              Nav.updateSearch({ ...query, tab: newTab === 'myWorkspaces' ? undefined : newTab });
            }
          },
          tabs,
        },
        [
          h(RenderedWorkspaces, {
            workspaces,
            loadingWorkspaces,
            setCreatingNewWorkspace,
            tabs,
            initialFiltered,
            filteredWorkspaces,
            loadingSubmissionStats,
            setCloningWorkspaceId,
            setDeletingWorkspaceId,
            setLockingWorkspaceId,
            setSharingWorkspace,
            setLeavingWorkspaceId,
            setRequestingAccessWorkspaceId,
          }),
        ]
      ),
      creatingNewWorkspace &&
        h(NewWorkspaceModal, {
          onDismiss: () => setCreatingNewWorkspace(false),
          onSuccess: ({ namespace, name }) => Nav.goToPath('workspace-dashboard', { namespace, name }),
        }),
      cloningWorkspaceId &&
        h(NewWorkspaceModal, {
          cloneWorkspace: getWorkspace(cloningWorkspaceId),
          onDismiss: () => setCloningWorkspaceId(undefined),
          onSuccess: ({ namespace, name }) => Nav.goToPath('workspace-dashboard', { namespace, name }),
        }),
      deletingWorkspaceId &&
        h(DeleteWorkspaceModal, {
          workspace: getWorkspace(deletingWorkspaceId),
          onDismiss: () => setDeletingWorkspaceId(undefined),
          onSuccess: refreshWorkspaces,
        }),
      lockingWorkspaceId &&
        h(LockWorkspaceModal, {
          workspace: getWorkspace(lockingWorkspaceId),
          onDismiss: () => setLockingWorkspaceId(undefined),
          onSuccess: refreshWorkspaces,
        }),
      !!sharingWorkspace &&
        h(ShareWorkspaceModal, {
          workspace: sharingWorkspace,
          onDismiss: () => setSharingWorkspace(undefined),
        }),
      leavingWorkspaceId &&
        h(LeaveResourceModal, {
          samResourceId: leavingWorkspaceId,
          samResourceType: 'workspace',
          displayName: 'workspace',
          onDismiss: () => setLeavingWorkspaceId(undefined),
          onSuccess: refreshWorkspaces,
        }),
      requestingAccessWorkspaceId &&
        h(RequestAccessModal, {
          workspace: getWorkspace(requestingAccessWorkspaceId),
          onDismiss: () => setRequestingAccessWorkspaceId(undefined),
        }),
      loadingWorkspaces && (!workspaces ? transparentSpinnerOverlay : topSpinnerOverlay),
    ]),
  ]);
};
