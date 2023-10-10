import { TooltipTrigger } from '@terra-ui-packages/components';
import { cond } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import {
  CSSProperties,
  ForwardedRef,
  Fragment,
  PropsWithChildren,
  ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { div, h, h3, i, span } from 'react-hyperscript-helpers';
import * as breadcrumbs from 'src/components/breadcrumbs';
import Collapse from 'src/components/Collapse';
import { ButtonPrimary, ButtonSecondary, LabeledCheckbox, Link, spinnerOverlay } from 'src/components/common';
import { centeredSpinner, icon, spinner } from 'src/components/icons';
import { InfoBox } from 'src/components/InfoBox';
import { MarkdownEditor, MarkdownViewer } from 'src/components/markdown';
import { SimpleTable } from 'src/components/table';
import { WorkspaceTagSelect } from 'src/components/workspace-utils';
import { Ajax } from 'src/libs/ajax';
import { refreshTerraProfile } from 'src/libs/auth';
import { getEnabledBrand } from 'src/libs/brand-utils';
import colors from 'src/libs/colors';
import { reportError, withErrorReporting } from 'src/libs/error';
import Events from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import { getLocalPref, setLocalPref } from 'src/libs/prefs';
import { forwardRefWithName, useCancellation, useOnMount, useStore } from 'src/libs/react-utils';
import { authStore } from 'src/libs/state';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import {
  canEditWorkspace,
  canWrite,
  isGoogleWorkspace,
  isOwner,
  WorkspaceAccessLevel,
  WorkspaceACL,
} from 'src/libs/workspace-utils';
import SignIn from 'src/pages/SignIn';
import { CloudInformation } from 'src/pages/workspaces/workspace/Dashboard/CloudInformation';
import { WorkspaceInformation } from 'src/pages/workspaces/workspace/Dashboard/WorkspaceInformation';
import DashboardPublic from 'src/pages/workspaces/workspace/DashboardPublic';
import { displayConsentCodes, displayLibraryAttributes } from 'src/pages/workspaces/workspace/library-attributes';
import { InitializedWorkspaceWrapper as Workspace, StorageDetails } from 'src/pages/workspaces/workspace/useWorkspace';
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer';

const styles: Record<string, CSSProperties> = {
  authDomain: {
    padding: '0.5rem 0.25rem',
    marginBottom: '0.25rem',
    backgroundColor: colors.dark(0.15),
    ...Style.noWrapEllipsis,
  },
  tag: {
    padding: '0.25rem',
    margin: '0.15rem',
    backgroundColor: colors.dark(0.15),
    borderRadius: 10,
    overflow: 'hidden',
    wordWrap: 'break-word',
  },
};

const displayAttributeValue = (v: unknown): string => {
  return cond(
    [_.isArray(v), () => (v as string[]).join(', ')],
    [v === true, () => 'Yes'],
    [v === false, () => 'No'],
    [typeof v === 'string', () => v as string],
    [
      !!v && typeof v === 'object' && 'items' in v && _.isArray(v.items),
      () => ((v as any).items as string[]).join(', '),
    ],
    [typeof v === 'object', () => JSON.stringify(v)],
    () => JSON.stringify(v)
  );
};

const DataUseLimitations = ({ attributes }) => {
  return _.map(
    ({ key, title }) => {
      return div({ key, style: { display: 'inline-block', marginRight: '0.75rem' } }, [
        h(TooltipTrigger, { content: title }, [
          span({ style: { textDecoration: 'underline dotted' } }, [key.slice(8)]),
        ]),
        ': ',
        displayAttributeValue(attributes[key]),
      ]);
    },
    _.filter(({ key }) => _.has(key, attributes), displayConsentCodes)
  );
};

const DashboardAuthContainer = (props) => {
  const { namespace, name } = props;
  const { signInStatus } = useStore(authStore);
  const [featuredWorkspaces, setFeaturedWorkspaces] = useState<{ name: string; namespace: string }[]>();

  const isAuthInitialized = signInStatus !== 'uninitialized';

  useEffect(() => {
    const fetchData = async () => {
      setFeaturedWorkspaces(await Ajax().FirecloudBucket.getFeaturedWorkspaces());
    };
    if (signInStatus === 'signedOut') {
      fetchData();
    }
  }, [signInStatus]);

  const isFeaturedWorkspace = () => _.some((ws) => ws.namespace === namespace && ws.name === name, featuredWorkspaces);

  return cond(
    [
      !isAuthInitialized || (signInStatus === 'signedOut' && featuredWorkspaces === undefined),
      () => centeredSpinner({ style: { position: 'fixed' } }),
    ],
    [signInStatus === 'signedOut' && isFeaturedWorkspace(), () => h(DashboardPublic, props)],
    [signInStatus === 'signedOut', () => h(SignIn)],
    () => h(WorkspaceDashboard, props)
  );
};

interface RightBoxSectionProps {
  title: string;
  info?: ReactNode;
  initialOpenState;
  afterTitle?: ReactNode;
  onClick;
}

const RightBoxSection = (props: PropsWithChildren<RightBoxSectionProps>) => {
  const { title, info, initialOpenState, afterTitle, onClick, children } = props;
  return div({ style: { paddingTop: '1rem' } }, [
    div({ style: Style.dashboard.rightBoxContainer }, [
      h(
        Collapse,
        {
          title: h3({ style: Style.dashboard.collapsibleHeader as CSSProperties }, [title, info]),
          summaryStyle: { color: colors.accent() },
          initialOpenState,
          titleFirst: true,
          afterTitle,
          onClick,
        },
        [children]
      ),
    ]),
  ]);
};

export const WorkspaceNotifications = ({ workspace }) => {
  const {
    workspace: { namespace, name },
  } = workspace;

  const [saving, setSaving] = useState(false);

  const notificationsPreferences = _.pickBy((_v, k) => _.startsWith('notifications/', k), authStore.get().profile);

  const submissionNotificationKeys = [
    `notifications/SuccessfulSubmissionNotification/${namespace}/${name}`,
    `notifications/FailedSubmissionNotification/${namespace}/${name}`,
    `notifications/AbortedSubmissionNotification/${namespace}/${name}`,
  ];

  const submissionNotificationsEnabled = !_.isMatch(
    _.fromPairs(_.map((k) => [k, 'false'], submissionNotificationKeys)),
    notificationsPreferences
  );

  return div({ style: { margin: '0.5rem' } }, [
    div({ style: { display: 'flex', alignItems: 'center' } }, [
      h(
        LabeledCheckbox,
        {
          checked: submissionNotificationsEnabled,
          disabled: saving,
          onChange: _.flow(
            Utils.withBusyState(setSaving),
            withErrorReporting('Error saving preferences')
          )(async (value) => {
            await Ajax().User.profile.setPreferences(
              _.fromPairs(_.map((k) => [k, JSON.stringify(value)], submissionNotificationKeys))
            );
            await refreshTerraProfile();
            Ajax().Metrics.captureEvent(Events.notificationToggle, {
              notificationKeys: submissionNotificationKeys,
              enabled: value,
            });
          }),
        },
        [span({ style: { marginLeft: '1ch' } }, ['Receive submission notifications'])]
      ),
      h(InfoBox, { style: { marginLeft: '1ch' } }, [
        'Receive email notifications when a submission in this workspace has succeeded, failed, or been aborted.',
      ]),
      saving && spinner({ size: 12, style: { marginLeft: '1ch' } }),
    ]),
  ]);
};

interface WorkspaceDashboardProps {
  namespace: string;
  name: string;
  refreshWorkspace: () => void;
  storageDetails: StorageDetails;
  workspace: Workspace;
}

const WorkspaceDashboardComponent = (props: WorkspaceDashboardProps, ref: ForwardedRef<unknown>): ReactNode => {
  const {
    namespace,
    name,
    refreshWorkspace,
    storageDetails,
    workspace,
    workspace: {
      accessLevel,
      owners = [],
      workspace: { authorizationDomain, attributes = { description: '' } },
    },
  } = props;

  const description = attributes.description;

  // State
  const [storageCost, setStorageCost] = useState<{ isSuccess: boolean; estimate: string; lastUpdated?: string }>();
  const [bucketSize, setBucketSize] = useState<{ isSuccess: boolean; usage: string; lastUpdated?: string }>();
  const [editDescription, setEditDescription] = useState<string>();
  const [saving, setSaving] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [consentStatus, setConsentStatus] = useState<string>();
  const [tagsList, setTagsList] = useState<string[]>();
  const [acl, setAcl] = useState<WorkspaceACL>();

  const persistenceId = `workspaces/${namespace}/${name}/dashboard`;

  const signal = useCancellation();

  const refresh = () => {
    loadConsent();
    loadWsTags();

    // If the current user is the only owner of the workspace, load the ACL to check if the workspace is shared.
    if (isOwner(accessLevel) && _.size(owners) === 1) {
      loadAcl();
    }
    updateGoogleBucketDetails(workspace);
  };

  const loadStorageCost = useMemo(
    () =>
      withErrorReporting('Error loading storage cost data', async () => {
        try {
          const { estimate, lastUpdated } = await Ajax(signal)
            .Workspaces.workspace(namespace, name)
            .storageCostEstimate();
          setStorageCost({ isSuccess: true, estimate, lastUpdated });
        } catch (error) {
          if (error instanceof Response && error.status === 404) {
            setStorageCost({ isSuccess: false, estimate: 'Not available' });
          } else {
            throw error;
          }
        }
      }),
    [namespace, name, signal]
  );

  const loadBucketSize = useMemo(
    () =>
      withErrorReporting('Error loading bucket size.', async () => {
        try {
          const { usageInBytes, lastUpdated } = await Ajax(signal).Workspaces.workspace(namespace, name).bucketUsage();
          setBucketSize({ isSuccess: true, usage: Utils.formatBytes(usageInBytes), lastUpdated });
        } catch (error) {
          if (error instanceof Response && error.status === 404) {
            setBucketSize({ isSuccess: false, usage: 'Not available' });
          } else {
            throw error;
          }
        }
      }),
    [namespace, name, signal]
  );

  const updateGoogleBucketDetails = useCallback(
    (workspace: Workspace) => {
      if (isGoogleWorkspace(workspace) && workspace.workspaceInitialized && canWrite(accessLevel)) {
        loadStorageCost();
        loadBucketSize();
      }
    },
    [accessLevel, loadStorageCost, loadBucketSize]
  );

  useEffect(() => {
    updateGoogleBucketDetails(workspace);
  }, [workspace, updateGoogleBucketDetails]);

  useImperativeHandle(ref, () => ({ refresh }));

  const [workspaceInfoPanelOpen, setWorkspaceInfoPanelOpen] = useState(
    () => getLocalPref(persistenceId)?.workspaceInfoPanelOpen
  );
  const [cloudInfoPanelOpen, setCloudInfoPanelOpen] = useState(
    () => getLocalPref(persistenceId)?.cloudInfoPanelOpen || false
  );
  const [ownersPanelOpen, setOwnersPanelOpen] = useState(() => getLocalPref(persistenceId)?.ownersPanelOpen || false);
  const [authDomainPanelOpen, setAuthDomainPanelOpen] = useState(
    () => getLocalPref(persistenceId)?.authDomainPanelOpen || false
  );
  const [tagsPanelOpen, setTagsPanelOpen] = useState(() => getLocalPref(persistenceId)?.tagsPanelOpen || false);
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(
    () => getLocalPref(persistenceId)?.notificationsPanelOpen || false
  );

  useEffect(() => {
    setLocalPref(persistenceId, {
      workspaceInfoPanelOpen,
      cloudInfoPanelOpen,
      ownersPanelOpen,
      authDomainPanelOpen,
      tagsPanelOpen,
      notificationsPanelOpen,
    });
  }, [
    persistenceId,
    workspaceInfoPanelOpen,
    cloudInfoPanelOpen,
    ownersPanelOpen,
    authDomainPanelOpen,
    tagsPanelOpen,
    notificationsPanelOpen,
  ]);

  // Helpers
  const loadConsent = withErrorReporting('Error loading data', async () => {
    const orspId = attributes['library:orsp'];
    if (orspId) {
      try {
        const { translatedUseRestriction } = await Ajax(signal).Duos.getConsent(orspId);
        setConsentStatus(translatedUseRestriction);
      } catch (error) {
        if (error instanceof Response) {
          switch (error.status) {
            case 400:
              setConsentStatus(`Structured Data Use Limitations are not approved for ${orspId}`);
              break;
            case 404:
              setConsentStatus(`Structured Data Use Limitations are not available for ${orspId}`);
              break;
            default:
              throw error;
          }
        } else {
          throw error;
        }
      }
    }
  });

  const loadWsTags = withErrorReporting('Error loading workspace tags', async () => {
    setTagsList(await Ajax(signal).Workspaces.workspace(namespace, name).getTags());
  });

  const addTag = _.flow(
    withErrorReporting('Error adding tag'),
    Utils.withBusyState(setBusy)
  )(async (tag) => {
    setTagsList(await Ajax().Workspaces.workspace(namespace, name).addTag(tag));
  });

  const deleteTag = _.flow(
    withErrorReporting('Error removing tag'),
    Utils.withBusyState(setBusy)
  )(async (tag) => {
    setTagsList(await Ajax().Workspaces.workspace(namespace, name).deleteTag(tag));
  });

  const loadAcl = withErrorReporting('Error loading ACL', async () => {
    const { acl } = await Ajax(signal).Workspaces.workspace(namespace, name).getAcl();
    setAcl(acl);
  });

  const save = Utils.withBusyState(setSaving, async () => {
    try {
      await Ajax().Workspaces.workspace(namespace, name).shallowMergeNewAttributes({ description: editDescription });
      await refreshWorkspace();
    } catch (error) {
      reportError('Error saving workspace', error);
    } finally {
      setEditDescription(undefined);
    }
  });

  // Lifecycle
  useOnMount(() => {
    refresh();
  });

  // Render
  const isEditing = _.isString(editDescription);
  const brand = getEnabledBrand();
  const { value: canEdit, message: editErrorMessage } = canEditWorkspace(workspace);

  return div({ style: { flex: 1, display: 'flex' } }, [
    div({ style: Style.dashboard.leftBox }, [
      div({ style: Style.dashboard.header }, [
        'About the workspace',
        !isEditing &&
          h(
            Link,
            {
              style: { marginLeft: '0.5rem' },
              disabled: !canEdit,
              tooltip: canEdit ? 'Edit description' : editErrorMessage,
              onClick: () => setEditDescription(description?.toString()),
            },
            [icon('edit')]
          ),
      ]),
      cond(
        [
          isEditing,
          () =>
            h(Fragment, [
              // @ts-expect-error
              h(MarkdownEditor, {
                placeholder: 'Enter a description',
                value: editDescription,
                onChange: setEditDescription,
              }),
              div({ style: { display: 'flex', justifyContent: 'flex-end', margin: '1rem' } }, [
                h(ButtonSecondary, { onClick: () => setEditDescription(undefined) }, ['Cancel']),
                h(ButtonPrimary, { style: { marginLeft: '1rem' }, onClick: save }, ['Save']),
              ]),
              saving && spinnerOverlay,
            ]),
        ],
        // @ts-expect-error
        [!!description, () => h(MarkdownViewer, [description?.toString()])],
        () => div({ style: { fontStyle: 'italic' } }, ['No description added'])
      ),
      _.some(_.startsWith('library:'), _.keys(attributes)) &&
        h(Fragment, [
          div({ style: Style.dashboard.header }, ['Dataset Attributes']),
          // @ts-expect-error
          h(SimpleTable, {
            'aria-label': 'dataset attributes table',
            rows: _.flow(
              _.map(({ key, title }) => ({ name: title, value: displayAttributeValue(attributes[key]) })),
              Utils.append({
                name: 'Structured Data Use Limitations',
                value: attributes['library:orsp'] ? consentStatus : h(DataUseLimitations, { attributes }),
              }),
              _.filter('value')
            )(displayLibraryAttributes),
            columns: [
              { key: 'name', size: { grow: 1 } },
              { key: 'value', size: { grow: 2 } },
            ],
          }),
        ]),
    ]),
    div({ style: Style.dashboard.rightBox }, [
      h(
        RightBoxSection,
        {
          title: 'Workspace information',
          initialOpenState: workspaceInfoPanelOpen !== undefined ? workspaceInfoPanelOpen : true,
          onClick: () =>
            setWorkspaceInfoPanelOpen(workspaceInfoPanelOpen === undefined ? false : !workspaceInfoPanelOpen),
        },
        [h(WorkspaceInformation, { workspace })]
      ),
      h(
        RightBoxSection,
        {
          title: 'Cloud information',
          initialOpenState: cloudInfoPanelOpen,
          onClick: () => setCloudInfoPanelOpen(!cloudInfoPanelOpen),
        },
        [h(CloudInformation, { workspace, storageDetails, bucketSize, storageCost })]
      ),
      h(
        RightBoxSection,
        {
          title: 'Owners',
          initialOpenState: ownersPanelOpen,
          afterTitle: OwnerNotice({ acl, accessLevel, owners }),
          onClick: () => setOwnersPanelOpen(!ownersPanelOpen),
        },
        [
          div(
            { style: { margin: '0.5rem' } },
            _.map((email) => {
              return div(
                { key: email, style: { overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.5rem' } },
                [h(Link, { href: `mailto:${email}` }, [email])]
              );
            }, owners)
          ),
        ]
      ),
      !_.isEmpty(authorizationDomain) &&
        h(
          RightBoxSection,
          {
            title: 'Authorization domain',
            initialOpenState: authDomainPanelOpen,
            onClick: () => setAuthDomainPanelOpen(!authDomainPanelOpen),
          },
          [
            div({ style: { margin: '0.5rem 0.5rem 1rem 0.5rem' } }, [
              'Collaborators must be a member of all of these ',
              h(
                Link,
                {
                  href: Nav.getLink('groups'),
                  ...Utils.newTabLinkProps,
                },
                ['groups']
              ),
              ' to access this workspace.',
            ]),
            ..._.map(
              ({ membersGroupName }) => div({ style: { margin: '0.5rem', fontWeight: 500 } }, [membersGroupName]),
              authorizationDomain
            ),
          ]
        ),
      h(
        RightBoxSection,
        {
          title: 'Tags',
          info: span({}, [
            (busy || !tagsList) && tagsPanelOpen && spinner({ size: 1, style: { marginLeft: '0.5rem' } }),
          ]),
          initialOpenState: tagsPanelOpen,
          onClick: () => setTagsPanelOpen(!tagsPanelOpen),
        },
        [
          div({ style: { margin: '0.5rem' } }, [
            div({ style: { marginBottom: '0.5rem', fontSize: 12 } }, [
              `${brand.name} is not intended to host personally identifiable information.`,
              h(InfoBox, { style: { marginLeft: '0.25rem' } }, [
                `${brand.name} is not intended to host personally identifiable information. Do not use any patient identifier including name,
              social security number, or medical record number.`,
              ]),
            ]),
            canEdit &&
              div({ style: { marginBottom: '0.5rem' } }, [
                h(WorkspaceTagSelect, {
                  menuShouldScrollIntoView: false,
                  value: null,
                  placeholder: 'Add a tag',
                  'aria-label': 'Add a tag',
                  onChange: ({ value }) => addTag(value),
                }),
              ]),
            div({ style: { display: 'flex', flexWrap: 'wrap', minHeight: '1.5rem' } }, [
              _.map((tag) => {
                return span({ key: tag, style: styles.tag }, [
                  tag,
                  canEdit &&
                    h(
                      Link,
                      {
                        tooltip: 'Remove tag',
                        disabled: busy,
                        onClick: () => deleteTag(tag),
                        style: { marginLeft: '0.25rem', verticalAlign: 'middle', display: 'inline-block' },
                      },
                      [icon('times', { size: 14 })]
                    ),
                ]);
              }, tagsList),
              !!tagsList && _.isEmpty(tagsList) && i(['No tags yet']),
            ]),
          ]),
        ]
      ),
      h(
        RightBoxSection,
        {
          title: 'Notifications',
          initialOpenState: notificationsPanelOpen,
          onClick: () => setNotificationsPanelOpen(!notificationsPanelOpen),
        },
        [h(WorkspaceNotifications, { workspace })]
      ),
    ]),
  ]);
};

const WorkspaceDashboard = _.flow(
  forwardRefWithName('WorkspaceDashboard'),
  wrapWorkspace({
    breadcrumbs: (props) => breadcrumbs.commonPaths.workspaceDashboard(props),
    activeTab: 'dashboard',
    title: 'Dashboard',
  })
)(WorkspaceDashboardComponent);

export const navPaths = [
  {
    name: 'workspace-dashboard',
    path: '/workspaces/:namespace/:name',
    component: DashboardAuthContainer,
    title: ({ name }) => `${name} - Dashboard`,
    public: true,
  },
];

interface OwnerNoticeProps {
  owners: string[];
  accessLevel: WorkspaceAccessLevel;
  acl?: WorkspaceACL;
}

const OwnerNotice = (props: OwnerNoticeProps): ReactNode => {
  const { owners, accessLevel, acl } = props;
  const notice = cond(
    // No warning if there are multiple owners.
    [_.size(owners) !== 1, () => null],
    // If the current user does not own the workspace, then then workspace must be shared.
    [
      !isOwner(accessLevel),
      () =>
        h(Fragment, [
          'This shared workspace has only one owner. Consider requesting ',
          h(Link, { href: `mailto:${owners[0]}` }, [owners[0]]),
          ' to add another owner to ensure someone is able to manage the workspace in case they lose access to their account.',
        ]),
    ],
    // If the current user is the only owner of the workspace, check if the workspace is shared.
    [
      _.size(acl) > 1,
      () =>
        h(Fragment, [
          'You are the only owner of this shared workspace. Consider adding another owner to ensure someone is able to manage the workspace in case you lose access to your account.',
        ]),
    ]
  );
  return !notice
    ? undefined
    : h(
        InfoBox,
        {
          iconOverride: 'error-standard',
          style: { color: colors.accent() },
        },
        [notice]
      );
};
