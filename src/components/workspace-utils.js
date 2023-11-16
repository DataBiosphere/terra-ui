import debouncePromise from 'debounce-promise';
import _ from 'lodash/fp';
import { useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { CloudProviderIcon } from 'src/components/CloudProviderIcon';
import { AsyncCreatableSelect, Clickable, Link, VirtualizedSelect } from 'src/components/common';
import { WorkspaceSubmissionStatusIcon } from 'src/components/WorkspaceSubmissionStatusIcon';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { withErrorReporting } from 'src/libs/error';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import { getLocalPref, setLocalPref } from 'src/libs/prefs';
import { useCancellation, useInstance, useOnMount, useStore, withDisplayName } from 'src/libs/react-utils';
import { workspacesStore } from 'src/libs/state';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { cloudProviderLabels, getCloudProviderFromWorkspace } from 'src/libs/workspace-utils';

export const useWorkspaces = (fieldsArg, stringAttributeMaxLength) => {
  const signal = useCancellation();
  const [loading, setLoading] = useState(false);
  const workspaces = useStore(workspacesStore);

  const fields = fieldsArg || [
    'accessLevel',
    'public',
    'workspace',
    'workspace.state',
    'workspace.attributes.description',
    'workspace.attributes.tag:tags',
    'workspace.workspaceVersion',
  ];

  const refresh = _.flow(
    withErrorReporting('Error loading workspace list'),
    Utils.withBusyState(setLoading)
  )(async () => {
    const ws = await Ajax(signal).Workspaces.list(fields, stringAttributeMaxLength);
    workspacesStore.set(ws);
  });
  useOnMount(() => {
    refresh();
  });
  return { workspaces, refresh, loading };
};

export const useWorkspaceDetails = ({ namespace, name }, fields) => {
  const [workspace, setWorkspace] = useState();

  const [loading, setLoading] = useState(true);
  const signal = useCancellation();

  const refresh = _.flow(
    withErrorReporting('Error loading workspace details'),
    Utils.withBusyState(setLoading)
  )(async () => {
    const ws = await Ajax(signal).Workspaces.workspace(namespace, name).details(fields);
    setWorkspace(ws);
  });

  useOnMount(() => {
    refresh();
  }, []);

  return { workspace, refresh, loading };
};

export const withWorkspaces = (WrappedComponent) => {
  return withDisplayName('withWorkspaces', (props) => {
    const { workspaces, refresh, loading } = useWorkspaces();
    return h(WrappedComponent, {
      ...props,
      workspaces,
      loadingWorkspaces: loading,
      refreshWorkspaces: refresh,
    });
  });
};

export const WorkspaceSelector = ({ workspaces, value, onChange, id, 'aria-label': ariaLabel, ...props }) => {
  const options = _.flow(
    _.sortBy((ws) => ws.workspace.name.toLowerCase()),
    _.map(({ workspace: { workspaceId, name, cloudPlatform, bucketName } }) => ({
      'aria-label': `${cloudProviderLabels[cloudPlatform]} ${name}`,
      value: workspaceId,
      label: name,
      workspace: { cloudPlatform, bucketName },
    }))
  )(workspaces);
  return h(VirtualizedSelect, {
    id,
    'aria-label': ariaLabel || 'Select a workspace',
    placeholder: 'Select a workspace',
    disabled: !workspaces,
    value,
    onChange: ({ value }) => onChange(value),
    options,
    formatOptionLabel: (opt) => {
      const {
        label,
        workspace: { cloudPlatform },
      } = opt;
      return div({ style: { display: 'flex', alignItems: 'center' } }, [
        h(CloudProviderIcon, {
          // Convert workspace cloudPlatform (Azure, Gcp) to CloudProvider (AZURE, GCP).
          cloudProvider: cloudPlatform.toUpperCase(),
          style: { marginRight: '0.5rem' },
        }),
        label,
      ]);
    },
    ...props,
  });
};

export const WorkspaceTagSelect = (props) => {
  const signal = useCancellation();
  const getTagSuggestions = useInstance(() =>
    debouncePromise(
      withErrorReporting('Error loading tags', async (text) => {
        return _.map(({ tag, count }) => {
          return { value: tag, label: `${tag} (${count})` };
        }, await Ajax(signal).Workspaces.getTags(text, 10));
      }),
      250
    )
  );
  return h(AsyncCreatableSelect, {
    allowCreateWhileLoading: true,
    defaultOptions: true,
    loadOptions: getTagSuggestions,
    ...props,
  });
};

export const recentlyViewedPersistenceId = 'workspaces/recentlyViewed';

export const updateRecentlyViewedWorkspaces = (workspaceId) => {
  const recentlyViewed = getLocalPref(recentlyViewedPersistenceId)?.recentlyViewed || [];
  // Recently viewed workspaces are limited to 4. Additionally, if a user clicks a workspace multiple times,
  // we only want the most recent instance stored in the list.
  const updatedRecentlyViewed = _.flow(
    _.remove({ workspaceId }),
    _.concat([{ workspaceId, timestamp: Date.now() }]),
    _.orderBy(['timestamp'], ['desc']),
    _.take(4)
  )(recentlyViewed);
  setLocalPref(recentlyViewedPersistenceId, { recentlyViewed: updatedRecentlyViewed });
};

export const RecentlyViewedWorkspaceCard = ({ workspace, submissionStatus, loadingSubmissionStats, timestamp }) => {
  const {
    workspace: { namespace, name },
  } = workspace;

  const dateViewed = Utils.makeCompleteDate(new Date(parseInt(timestamp)).toString());

  return h(
    Clickable,
    {
      style: {
        ...Style.elements.card.container,
        maxWidth: 'calc(25% - 10px)',
        margin: '0 0.25rem',
        lineHeight: '1.5rem',
        flex: '0 1 calc(25% - 10px)',
      },
      href: Nav.getLink('workspace-dashboard', { namespace, name }),
      onClick: () => {
        Ajax().Metrics.captureEvent(Events.workspaceOpenFromRecentlyViewed, extractWorkspaceDetails(workspace.workspace));
      },
    },
    [
      div({ style: { flex: 'none' } }, [
        div({ style: { color: colors.accent(), ...Style.noWrapEllipsis, fontSize: 16, marginBottom: 7 } }, name),
        div({ style: { display: 'flex', justifyContent: 'space-between' } }, [
          div({ style: { ...Style.noWrapEllipsis, whiteSpace: 'pre-wrap', fontStyle: 'italic' } }, `Viewed ${dateViewed}`),
          div({ style: { display: 'flex', alignItems: 'center' } }, [
            h(WorkspaceSubmissionStatusIcon, {
              status: submissionStatus,
              loadingSubmissionStats,
            }),
            h(CloudProviderIcon, { cloudProvider: getCloudProviderFromWorkspace(workspace), style: { marginLeft: 5 } }),
          ]),
        ]),
      ]),
    ]
  );
};

export const NoWorkspacesMessage = ({ onClick }) => {
  return div({ style: { fontSize: 20, margin: '1rem' } }, [
    div([
      'To get started, ',
      h(
        Link,
        {
          onClick,
          style: { fontWeight: 600 },
        },
        ['Create a New Workspace']
      ),
    ]),
    div({ style: { marginTop: '1rem', fontSize: 16 } }, [
      h(
        Link,
        {
          ...Utils.newTabLinkProps,
          href: 'https://support.terra.bio/hc/en-us/articles/360024743371',
        },
        ["What's a workspace?"]
      ),
    ]),
  ]);
};
